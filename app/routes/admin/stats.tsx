import {
  AdminShell,
  Metric,
  MiniBarChart,
  ProtocolDistribution,
  Section,
  Sparkline,
  formatMoney
} from "@/features/admin/components";
import { getDb } from "@/db/client";
import { listOrders, listProviderConfigs } from "@/features/admin/repository";
import {
  createMockStats,
  formatRangeLabel,
  granularityLabel,
  metricTitle,
  metricValue,
  readStatsFilters,
  type StatsFilters as StatsFiltersValue
} from "@/features/admin/stats";
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
  const db = getDb(c);
  const [orderRows, providers] = await Promise.all([listOrders(db), listProviderConfigs(db)]);
  const filters = readStatsFilters(c.req.query.bind(c.req));
  const statsData = createMockStats(filters);
  const paidOrders = orderRows.filter((order) => order.status === "paid");
  const protocolCounts = {
    routerpay: orderRows.filter((order) => order.inboundProtocol === "routerpay").length,
    easypay: orderRows.filter((order) => order.inboundProtocol === "easypay").length
  };

  return c.render(
    <AdminShell title="统计面板">
      <div class="space-y-6">
        <StatsFilters filters={filters} providers={providers.map((provider) => provider.provider)} error={statsData.error} />
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="支付金额" value={formatMoney(statsData.summary.amountMinor, filters.currency)} icon="credit-card" />
          <Metric label="订单数" value={String(statsData.summary.orderCount)} icon="activity" tone="success" />
          <Metric label="成功率" value={`${statsData.summary.successRate}%`} detail={`${paidOrders.length || statsData.summary.paidCount} 笔已支付`} icon="chart" tone="warning" />
          <Metric label="回调成功率" value={`${statsData.summary.callbackRate}%`} icon="webhook" tone="neutral" />
        </section>
        <div class="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <Section title={metricTitle(filters.metric)} action={<span class="badge badge-info">{statsData.points.length} 点</span>}>
            <div class="p-5">
              <div class="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p class="text-2xl font-semibold text-ink">{metricValue(filters.metric, statsData.summary, filters.currency, formatMoney)}</p>
                  <p class="mt-1 text-sm text-muted">
                    {formatRangeLabel(statsData.from, statsData.to)} · {granularityLabel(filters.granularity)}
                  </p>
                </div>
              </div>
              <Sparkline values={statsData.points.map((point) => point.value)} />
              <div class="mt-4 flex justify-between text-xs text-muted">
                <span>{statsData.points[0]?.label}</span>
                <span>{statsData.points[statsData.points.length - 1]?.label}</span>
              </div>
            </div>
          </Section>
          <ProtocolDistribution routerpay={protocolCounts.routerpay || statsData.breakdown.protocol.routerpay} easypay={protocolCounts.easypay || statsData.breakdown.protocol.easypay} />
        </div>
        <div class="grid gap-6 xl:grid-cols-2">
          <Section title="订单状态">
            <div class="p-5">
              <MiniBarChart
                labels={["创建", "待付", "成功", "失败", "退款"]}
                values={[
                  Math.max(3, orderRows.filter((order) => order.status === "created").length, statsData.breakdown.status.created),
                  Math.max(2, orderRows.filter((order) => order.status === "pending").length, statsData.breakdown.status.pending),
                  Math.max(8, paidOrders.length, statsData.breakdown.status.paid),
                  Math.max(1, orderRows.filter((order) => order.status === "failed").length, statsData.breakdown.status.failed),
                  Math.max(1, orderRows.filter((order) => order.status === "refunded").length, statsData.breakdown.status.refunded)
                ]}
              />
            </div>
          </Section>
          <Section title="渠道分布">
            <div class="p-5">
              <MiniBarChart labels={statsData.breakdown.providers.map((provider) => provider.label)} values={statsData.breakdown.providers.map((provider) => provider.value)} />
            </div>
          </Section>
        </div>
        <Section title="失败原因">
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>原因</th>
                  <th>次数</th>
                  <th>占比</th>
                </tr>
              </thead>
              <tbody>
                {statsData.failureReasons.map((reason) => (
                  <tr>
                    <td class="font-medium text-ink">{reason.label}</td>
                    <td>{reason.count}</td>
                    <td>{reason.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </AdminShell>,
    { title: "统计面板" }
  );
});

function StatsFilters(props: { filters: StatsFiltersValue; providers: string[]; error?: string }) {
  const filters = props.filters;

  return (
    <Section title="筛选">
      <form class="stats-filters" method="get" action="/admin/stats">
        <div class="stats-filter-row stats-filter-row-time">
          <select name="range" class="toolbar-select">
            {[
              ["today", "今天"],
              ["yesterday", "昨天"],
              ["7d", "最近 7 天"],
              ["30d", "最近 30 天"],
              ["90d", "最近 90 天"],
              ["custom", "自定义"]
            ].map(([value, label]) => (
              <option value={value} selected={filters.range === value}>
                {label}
              </option>
            ))}
          </select>
          <label class="stats-field">
            <span>开始</span>
            <input type="datetime-local" name="from" value={filters.from} />
          </label>
          <label class="stats-field">
            <span>结束</span>
            <input type="datetime-local" name="to" value={filters.to} />
          </label>
          <select name="granularity" class="toolbar-select">
            {[
              ["minute", "分钟"],
              ["hour", "小时"],
              ["day", "天"],
              ["week", "周"]
            ].map(([value, label]) => (
              <option value={value} selected={filters.granularity === value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div class="stats-filter-row stats-filter-row-dimensions">
          <select name="metric" class="toolbar-select">
            {[
              ["amount", "金额"],
              ["count", "订单数"],
              ["success", "成功率"],
              ["callback", "回调"]
            ].map(([value, label]) => (
              <option value={value} selected={filters.metric === value}>
                {label}
              </option>
            ))}
          </select>
          <select name="protocol" class="toolbar-select">
            <option value="" selected={!filters.protocol}>全部协议</option>
            <option value="routerpay" selected={filters.protocol === "routerpay"}>RouterPay</option>
            <option value="easypay" selected={filters.protocol === "easypay"}>EasyPay</option>
          </select>
          <select name="provider" class="toolbar-select">
            <option value="" selected={!filters.provider}>全部渠道</option>
            {Array.from(new Set(["afdian", ...props.providers])).map((provider) => (
              <option value={provider} selected={filters.provider === provider}>
                {provider}
              </option>
            ))}
          </select>
          <select name="status" class="toolbar-select">
            <option value="" selected={!filters.status}>全部状态</option>
            {["created", "pending", "paid", "failed", "refunded"].map((status) => (
              <option value={status} selected={filters.status === status}>
                {status}
              </option>
            ))}
          </select>
          <select name="currency" class="toolbar-select">
            {["CNY", "USD"].map((currency) => (
              <option value={currency} selected={filters.currency === currency}>
                {currency}
              </option>
            ))}
          </select>
          <div class="stats-actions">
            <button class="toolbar-button" type="submit">刷新</button>
            <a class="toolbar-link" href="/admin/stats">重置</a>
            <button class="toolbar-link" type="button">导出</button>
          </div>
        </div>
      </form>
      {props.error ? <div class="border-t border-line px-5 py-3 text-sm text-danger">{props.error}</div> : null}
    </Section>
  );
}
