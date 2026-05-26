import type {
  CallbackDeliverySummary,
  CallbackProtocol,
  OrderSummary,
  ProtocolSettings,
  ProviderConfigSummary,
  RouterPayOrderStatus
} from "@/shared/types";
import {
  Activity,
  BarChart3,
  Copy,
  CreditCard,
  ExternalLink,
  Filter,
  Home,
  List,
  RefreshCw,
  Search,
  Settings,
  Webhook
} from "lucide";

type Child = unknown;
type LucideNode = [string, Record<string, string | number>, LucideNode[]?];

const navItems = [
  ["首页", "/admin", "home"],
  ["订单", "/admin/orders", "credit-card"],
  ["回调", "/admin/callbacks", "webhook"],
  ["统计", "/admin/stats", "chart"],
  ["支付渠道", "/admin/provider-configs", "list"],
  ["接口开关", "/admin/protocol-settings", "settings"]
] as const;

const icons = {
  activity: Activity,
  chart: BarChart3,
  copy: Copy,
  "credit-card": CreditCard,
  external: ExternalLink,
  filter: Filter,
  home: Home,
  list: List,
  refresh: RefreshCw,
  search: Search,
  settings: Settings,
  webhook: Webhook
};

const statusTone: Record<RouterPayOrderStatus, string> = {
  created: "badge-neutral",
  pending: "badge-warning",
  paid: "badge-success",
  failed: "badge-danger",
  expired: "badge-neutral",
  refunded: "badge-info",
  partially_refunded: "badge-info",
  closed: "badge-neutral"
};

const deliveryTone: Record<CallbackDeliverySummary["status"], string> = {
  pending: "badge-warning",
  delivered: "badge-success",
  failed: "badge-danger"
};

export function AdminShell(props: { title: string; description?: string; children: Child }) {
  return (
    <div class="min-h-screen bg-dashboard text-ink">
      <aside class="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-sidebar px-3 py-3 xl:block">
        <a class="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-white" href="/admin" aria-label="RouterPay admin">
          <span class="grid h-8 w-8 place-items-center rounded-md bg-brand text-xs font-bold text-white">
            RP
          </span>
          <span class="min-w-0">
            <span class="block truncate text-sm font-semibold text-ink">RouterPay</span>
            <span class="block text-xs text-muted">测试环境</span>
          </span>
        </a>

        <nav class="mt-4 space-y-0.5">
          {navItems.map(([label, href, icon]) => (
            <a class="nav-link" href={href}>
              <Icon name={icon} class="h-4 w-4" />
              {label}
            </a>
          ))}
        </nav>

      </aside>

      <main class="xl:pl-60">
        <header class="sticky top-0 z-20 border-b border-line bg-white px-4 py-3 md:px-6">
          <div class="mx-auto flex max-w-[1360px] items-center gap-4">
            <form class="min-w-0 flex-1" action="/admin/orders" method="get">
              <label class="flex max-w-xl items-center rounded-md border border-line bg-panel px-3 py-2 text-sm text-muted">
                <Icon name="search" class="mr-2 h-4 w-4 text-muted" />
                <input
                  name="q"
                  class="w-full border-0 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                  placeholder="搜索订单、商户订单号"
                  type="search"
                />
              </label>
            </form>
            <span class="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 md:inline-flex">
              测试模式
            </span>
            <a class="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-panel" href="/">
              首页
            </a>
          </div>
        </header>

        <div class="border-b border-line bg-white px-4 py-3 xl:hidden">
          <div class="flex gap-2 overflow-x-auto">
            {navItems.map(([label, href]) => (
              <a class="mobile-nav-link" href={href}>
                {label}
              </a>
            ))}
          </div>
        </div>

        <div class="mx-auto max-w-[1360px] px-4 py-6 md:px-6">
          <div class="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 class="text-xl font-semibold tracking-tight text-ink md:text-2xl">{props.title}</h1>
              {props.description ? <p class="mt-2 max-w-2xl text-sm leading-6 text-muted">{props.description}</p> : null}
            </div>
          </div>
          {props.children}
        </div>
      </main>
    </div>
  );
}

export type IconName = keyof typeof icons;

export function Icon(props: { name: IconName; class?: string }) {
  const [, attrs, children = []] = icons[props.name] as LucideNode;

  return (
    <svg {...attrs} class={props.class ?? "h-4 w-4"} aria-hidden="true">
      {children.map((child) => renderLucideNode(child))}
    </svg>
  );
}

export function Section(props: { title: string; description?: string; action?: Child; children: Child; class?: string }) {
  return (
    <section class={`panel ${props.class ?? ""}`}>
      <div class="flex flex-col gap-3 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-base font-semibold tracking-tight text-ink">{props.title}</h2>
          {props.description ? <p class="mt-1 text-sm leading-6 text-muted">{props.description}</p> : null}
        </div>
        {props.action ? <div>{props.action}</div> : null}
      </div>
      {props.children}
    </section>
  );
}

export function Metric(props: {
  label: string;
  value: string;
  detail?: string;
  icon?: IconName;
  tone?: "brand" | "success" | "warning" | "neutral";
}) {
  return (
    <div class="metric-card">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-medium text-muted">{props.label}</p>
        {props.icon ? (
          <span class="metric-icon">
            <Icon name={props.icon} class="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p class="mt-2 text-2xl font-semibold tracking-tight text-ink">{props.value}</p>
      {props.detail ? <p class="mt-1 text-xs leading-5 text-muted">{props.detail}</p> : null}
    </div>
  );
}

export function StatGrid(props: { settings: ProtocolSettings; providers: ProviderConfigSummary[]; orders: OrderSummary[] }) {
  const enabledProviders = props.providers.filter((provider) => provider.enabled).length;
  const paidOrders = props.orders.filter((order) => order.status === "paid").length;
  const totalVolume = props.orders.reduce((sum, order) => sum + order.amountMinor, 0);
  const successRate = props.orders.length ? Math.round((paidOrders / props.orders.length) * 100) : 0;
  const enabledProtocols = [
    props.settings.routerpayApiEnabled,
    props.settings.easypayApiEnabled,
    props.settings.routerpayWebhookEnabled,
    props.settings.easypayNotifyEnabled
  ].filter(Boolean).length;

  return (
    <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="处理金额" value={formatMoney(totalVolume, "CNY")} icon="credit-card" tone="brand" />
      <Metric label="支付成功率" value={`${successRate}%`} detail={`${paidOrders}/${props.orders.length} 笔已支付`} icon="activity" tone="success" />
      <Metric label="启用渠道" value={String(enabledProviders)} detail={`${props.providers.length} 个渠道`} icon="list" tone="neutral" />
      <Metric label="接口开关" value={`${enabledProtocols}/4`} icon="settings" tone="warning" />
    </section>
  );
}

export function ProtocolSwitches(props: { settings: ProtocolSettings; detailed?: boolean }) {
  const rows = [
    {
      label: "RouterPay API",
      enabled: props.settings.routerpayApiEnabled,
      hint: "POST /api/v1/payments"
    },
    {
      label: "EasyPay 兼容 API",
      enabled: props.settings.easypayApiEnabled,
      hint: "/submit.php / api.php"
    },
    {
      label: "RouterPay Webhook",
      enabled: props.settings.routerpayWebhookEnabled,
      hint: "JSON 回调"
    },
    {
      label: "EasyPay Notify/Return",
      enabled: props.settings.easypayNotifyEnabled,
      hint: "form notify"
    }
  ];

  return (
    <Section title="接口与回调开关">
      <div class="divide-y divide-line">
        {rows.map((row) => (
          <div class="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm font-semibold text-ink">{row.label}</p>
              {props.detailed ? <p class="mt-1 text-xs text-muted">{row.hint}</p> : null}
            </div>
            {props.detailed ? (
              <label class="toggle">
                <input type="checkbox" checked={row.enabled} />
                <span />
              </label>
            ) : (
              <Badge tone={row.enabled ? "success" : "neutral"}>{row.enabled ? "启用" : "停用"}</Badge>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function ProviderTable(props: { providers: ProviderConfigSummary[] }) {
  return (
    <Section title="支付渠道配置">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>渠道</th>
              <th>状态</th>
              <th>模式</th>
              <th>优先级</th>
              <th>密钥</th>
              <th>更新时间</th>
            </tr>
          </thead>
          <tbody>
            {props.providers.map((provider) => (
              <tr>
                <td>
                  <div class="flex items-center gap-3">
                    <ProviderMark name={provider.displayName} />
                    <div>
                      <p class="font-semibold text-ink">{provider.displayName}</p>
                      <p class="text-xs text-muted">{provider.provider}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge tone={provider.enabled ? "success" : "neutral"}>{provider.enabled ? "启用" : "停用"}</Badge>
                </td>
                <td>{provider.testMode ? "测试环境" : "生产环境"}</td>
                <td>{provider.priority}</td>
                <td>
                  <Badge tone={provider.secretConfigured ? "info" : "warning"}>
                    {provider.secretConfigured ? "已配置" : "未配置"}
                  </Badge>
                </td>
                <td>{formatDate(provider.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {props.providers.length === 0 ? <EmptyState title="暂无支付渠道" description="添加 provider 后会显示在这里。" /> : null}
    </Section>
  );
}

export function OrdersControls(props: { query: string; status: string; protocol: string }) {
  return (
    <form class="toolbar" method="get" action="/admin/orders">
      <label class="toolbar-search">
        <Icon name="search" class="h-4 w-4 text-muted" />
        <input name="q" value={props.query} placeholder="搜索订单号" />
      </label>
      <select name="status" class="toolbar-select">
        <option value="">全部状态</option>
        {["created", "pending", "paid", "failed", "expired", "refunded", "partially_refunded", "closed"].map((status) => (
          <option value={status} selected={props.status === status}>
            {status}
          </option>
        ))}
      </select>
      <select name="protocol" class="toolbar-select">
        <option value="">全部协议</option>
        <option value="routerpay" selected={props.protocol === "routerpay"}>
          RouterPay
        </option>
        <option value="easypay" selected={props.protocol === "easypay"}>
          EasyPay
        </option>
      </select>
      <button class="toolbar-button" type="submit">
        <Icon name="filter" class="h-4 w-4" />
        筛选
      </button>
      <a class="toolbar-link" href="/admin/orders">
        重置
      </a>
    </form>
  );
}

export function OrdersTable(props: { orders: OrderSummary[]; compact?: boolean; filters?: Child }) {
  return (
    <Section
      title={props.compact ? "最近订单" : "订单"}
      description={undefined}
      action={
        props.compact ? (
          <a class="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark" href="/admin/orders">
            查看全部
            <Icon name="external" class="h-3.5 w-3.5" />
          </a>
        ) : null
      }
    >
      {!props.compact && props.filters ? <div class="border-b border-line px-4 py-3">{props.filters}</div> : null}
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>RouterPay 订单</th>
              <th>商户订单</th>
              <th>协议</th>
              <th>渠道</th>
              <th>状态</th>
              <th>金额</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {props.orders.map((order) => (
              <tr>
              <td>
                  <a class="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark" href={`/admin/orders/${order.routerpayOrderId}`}>
                    {shortId(order.routerpayOrderId)}
                    <Icon name="external" class="h-3.5 w-3.5" />
                  </a>
                </td>
                <td class="font-medium text-ink">{order.merchantOrderId}</td>
                <td>{protocolLabel(order.inboundProtocol)}</td>
                <td>{order.provider}</td>
                <td>
                  <OrderStatusBadge status={order.status} />
                </td>
                <td class="font-medium text-ink">{formatMoney(order.amountMinor, order.currency)}</td>
                <td>{formatDate(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {props.orders.length === 0 ? <EmptyState title="暂无订单" description="创建一笔 RouterPay 或 EasyPay 订单后会显示在这里。" /> : null}
    </Section>
  );
}

export function CallbackControls(props: { query: string; status: string; protocol: string }) {
  return (
    <form class="toolbar" method="get" action="/admin/callbacks">
      <label class="toolbar-search">
        <Icon name="search" class="h-4 w-4 text-muted" />
        <input name="q" value={props.query} placeholder="搜索投递 ID 或订单" />
      </label>
      <select name="status" class="toolbar-select">
        <option value="">全部状态</option>
        {["pending", "delivered", "failed"].map((status) => (
          <option value={status} selected={props.status === status}>
            {status}
          </option>
        ))}
      </select>
      <select name="protocol" class="toolbar-select">
        <option value="">全部协议</option>
        <option value="routerpay_webhook" selected={props.protocol === "routerpay_webhook"}>
          RouterPay Webhook
        </option>
        <option value="easypay_notify" selected={props.protocol === "easypay_notify"}>
          EasyPay Notify
        </option>
      </select>
      <button class="toolbar-button" type="submit">
        <Icon name="filter" class="h-4 w-4" />
        筛选
      </button>
      <a class="toolbar-link" href="/admin/callbacks">
        重置
      </a>
    </form>
  );
}

export function CallbackTable(props: { deliveries: CallbackDeliverySummary[]; compact?: boolean; filters?: Child }) {
  return (
    <Section
      title={props.compact ? "最近回调" : "回调投递"}
      description={undefined}
      action={
        props.compact ? (
          <a class="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark" href="/admin/callbacks">
            查看全部
            <Icon name="external" class="h-3.5 w-3.5" />
          </a>
        ) : null
      }
    >
      {!props.compact && props.filters ? <div class="border-b border-line px-4 py-3">{props.filters}</div> : null}
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>投递 ID</th>
              <th>订单</th>
              <th>协议</th>
              <th>状态</th>
              <th>次数</th>
              <th>HTTP</th>
              <th>下次重试</th>
            </tr>
          </thead>
          <tbody>
            {props.deliveries.map((delivery) => (
              <tr>
                <td class="font-semibold text-ink">{shortId(delivery.id)}</td>
                <td>
                  <a class="inline-flex items-center gap-1 font-medium text-brand hover:text-brand-dark" href={`/admin/orders/${delivery.routerpayOrderId}`}>
                    {shortId(delivery.routerpayOrderId)}
                    <Icon name="external" class="h-3.5 w-3.5" />
                  </a>
                </td>
                <td>{callbackLabel(delivery.callbackProtocol)}</td>
                <td>
                  <Badge class={deliveryTone[delivery.status]}>{delivery.status}</Badge>
                </td>
                <td>{delivery.attempts}</td>
                <td>{delivery.lastStatusCode ?? "-"}</td>
                <td>{delivery.nextRetryAt ? formatDate(delivery.nextRetryAt) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {props.deliveries.length === 0 ? <EmptyState title="暂无回调投递" description="支付成功并生成业务通知后会出现投递记录。" /> : null}
    </Section>
  );
}

export function OrderDetailCard(props: { order: OrderSummary }) {
  const order = props.order;

  return (
    <section class="panel overflow-hidden">
      <div class="border-b border-line bg-white px-5 py-5">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p class="text-xs font-semibold text-muted">订单详情</p>
            <h2 class="mt-2 break-all text-lg font-semibold tracking-tight text-ink">{order.routerpayOrderId}</h2>
            <p class="mt-1 text-sm text-muted">商户订单 {order.merchantOrderId}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>
      <dl class="grid gap-0 divide-y divide-line p-5 md:grid-cols-4 md:divide-x md:divide-y-0">
        <InfoItem label="金额" value={formatMoney(order.amountMinor, order.currency)} />
        <InfoItem label="协议" value={protocolLabel(order.inboundProtocol)} />
        <InfoItem label="渠道" value={order.provider} />
        <InfoItem label="支付时间" value={order.paidAt ? formatDate(order.paidAt) : "尚未支付"} />
      </dl>
    </section>
  );
}

export function PaymentTimeline(props: { order: OrderSummary }) {
  const paid = props.order.status === "paid";
  const steps = [
    ["created", "订单已创建", formatDate(props.order.createdAt), true],
    ["provider", "等待 provider 处理", props.order.provider, props.order.status !== "failed"],
    ["paid", "支付完成", props.order.paidAt ? formatDate(props.order.paidAt) : "等待回调确认", paid],
    ["callback", "业务回调投递", paid ? "进入投递队列" : "支付成功后触发", paid]
  ] as const;

  return (
    <Section title="支付时间线">
      <div class="space-y-0 p-5">
        {steps.map((step) => (
          <div class="relative flex gap-4 pb-6 last:pb-0">
            <span class={`mt-1 h-3 w-3 shrink-0 rounded-full ${step[3] ? "bg-brand shadow-brand" : "bg-line"}`} />
            <div>
              <p class="text-sm font-semibold text-ink">{step[1]}</p>
              <p class="mt-1 text-sm text-muted">{step[2]}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function EmptyState(props: { title: string; description: string }) {
  return (
    <div class="px-5 py-12 text-center">
      <div class="mx-auto grid h-10 w-10 place-items-center rounded-md border border-line bg-panel text-sm font-bold text-muted">-</div>
      <h3 class="mt-4 text-sm font-semibold text-ink">{props.title}</h3>
      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{props.description}</p>
    </div>
  );
}

export function MiniBarChart(props: { values: number[]; labels?: string[] }) {
  const max = Math.max(...props.values, 1);

  return (
    <div class="chart-bars" aria-hidden="true">
      {props.values.map((value, index) => (
        <div class="chart-bar-cell">
          <div class="chart-bar" style={`height:${Math.max(8, (value / max) * 100)}%`} />
          {props.labels?.[index] ? <span>{props.labels[index]}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function Sparkline(props: { values: number[] }) {
  const max = Math.max(...props.values, 1);
  const points = props.values
    .map((value, index) => {
      const x = (index / Math.max(props.values.length - 1, 1)) * 100;
      const y = 42 - (value / max) * 34;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg class="h-16 w-full" viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="var(--color-brand)" stroke-width="2.5" stroke-linecap="round" />
    </svg>
  );
}

export function ProtocolDistribution(props: { routerpay: number; easypay: number }) {
  const total = props.routerpay + props.easypay;
  const routerpayWidth = total ? (props.routerpay / total) * 100 : 50;
  const easypayWidth = 100 - routerpayWidth;

  return (
    <Section title="协议分布">
      <div class="space-y-4 p-5">
        <div class="distribution-bar">
          <span class="bg-brand" style={`width:${routerpayWidth}%`} />
          <span class="bg-cyan" style={`width:${easypayWidth}%`} />
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <DistributionItem label="RouterPay" value={props.routerpay} color="bg-brand" />
          <DistributionItem label="EasyPay" value={props.easypay} color="bg-cyan" />
        </div>
      </div>
    </Section>
  );
}

export function ProviderHealth(props: { providers: ProviderConfigSummary[] }) {
  return (
    <Section title="渠道状态">
      <div class="grid gap-0 divide-y divide-line">
        {props.providers.map((provider) => (
          <div class="flex items-center justify-between gap-4 px-5 py-4">
            <div class="flex items-center gap-3">
              <span class={`status-dot ${provider.enabled ? "status-dot-success" : "status-dot-muted"}`} />
              <div>
                <p class="text-sm font-semibold text-ink">{provider.displayName}</p>
                <p class="text-xs text-muted">{provider.testMode ? "测试环境" : "生产环境"}</p>
              </div>
            </div>
            <Badge tone={provider.enabled ? "success" : "neutral"}>{provider.enabled ? "正常" : "停用"}</Badge>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function TrendCard(props: { title: string; values: number[]; total: string; detail?: string }) {
  return (
    <Section title={props.title}>
      <div class="p-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-2xl font-semibold text-ink">{props.total}</p>
            {props.detail ? <p class="mt-1 text-sm text-muted">{props.detail}</p> : null}
          </div>
        </div>
        <div class="mt-5">
          <Sparkline values={props.values} />
        </div>
      </div>
    </Section>
  );
}

function DistributionItem(props: { label: string; value: number; color: string }) {
  return (
    <div class="rounded-md border border-line bg-panel p-3">
      <div class="flex items-center justify-between">
        <span class="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <span class={`h-2 w-2 rounded-full ${props.color}`} />
          {props.label}
        </span>
        <span class="text-sm font-semibold text-ink">{props.value}</span>
      </div>
    </div>
  );
}

export function OrderStatusBadge(props: { status: RouterPayOrderStatus }) {
  return <Badge class={statusTone[props.status]}>{props.status}</Badge>;
}

export function Badge(props: { children: Child; tone?: "success" | "warning" | "danger" | "info" | "neutral"; class?: string }) {
  const tone = props.class ?? `badge-${props.tone ?? "neutral"}`;

  return <span class={`badge ${tone}`}>{props.children}</span>;
}

export function InfoItem(props: { label: string; value: string }) {
  return (
    <div class="min-w-0 px-0 py-3 md:px-4">
      <dt class="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{props.label}</dt>
      <dd class="mt-2 break-words text-sm font-semibold text-ink">{props.value}</dd>
    </div>
  );
}

export function CopyButton(props: { value: string; children: Child; variant?: "primary" | "secondary" }) {
  const primary = props.variant === "primary";

  return (
    <button
      class={primary ? "button-primary w-full" : "button-secondary w-full"}
      data-copy={props.value}
      type="button"
    >
      <Icon name="copy" class="h-4 w-4" />
      <span data-copy-label>{props.children}</span>
    </button>
  );
}

export function formatMoney(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol"
  }).format(amountMinor / 100);
}

export function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function ProviderMark(props: { name: string }) {
  return (
    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,#f6f9fc,#e8f0ff)] text-sm font-black text-brand ring-1 ring-line">
      {props.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function protocolLabel(protocol: OrderSummary["inboundProtocol"]) {
  return protocol === "routerpay" ? "RouterPay" : "EasyPay";
}

function callbackLabel(protocol: CallbackProtocol) {
  return protocol === "routerpay_webhook" ? "RouterPay Webhook" : "EasyPay Notify";
}

function shortId(value: string) {
  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function renderLucideNode(node: LucideNode) {
  const [tag, attrs, children = []] = node;
  const Tag = tag as "circle";

  return <Tag {...attrs}>{children.map((child) => renderLucideNode(child))}</Tag>;
}
