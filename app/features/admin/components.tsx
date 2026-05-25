import type {
  CallbackDeliverySummary,
  OrderSummary,
  ProtocolSettings,
  ProviderConfigSummary
} from "@/shared/types";

const statusClass = {
  created: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-warning",
  paid: "bg-emerald-100 text-success",
  failed: "bg-red-100 text-danger",
  expired: "bg-slate-100 text-slate-700",
  refunded: "bg-blue-100 text-brand",
  partially_refunded: "bg-blue-100 text-brand",
  closed: "bg-slate-100 text-slate-700"
};

export function AdminShell(props: { title: string; children: unknown }) {
  const navItems = [
    ["总览", "/admin"],
    ["接口开关", "/admin/protocol-settings"],
    ["支付渠道", "/admin/provider-configs"],
    ["订单", "/admin/orders"],
    ["回调", "/admin/callbacks"],
    ["统计", "/admin/stats"]
  ];

  return (
    <div class="min-h-screen bg-[#f3f7fb]">
      <aside class="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-5 py-6 lg:block">
        <a class="block text-xl font-semibold tracking-tight text-ink" href="/admin">
          RouterPay
        </a>
        <p class="mt-2 text-sm leading-6 text-muted">支付路由与回调标准化中间件</p>
        <nav class="mt-8 space-y-1">
          {navItems.map(([label, href]) => (
            <a
              class="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-panel hover:text-ink"
              href={href}
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>
      <main class="lg:pl-64">
        <header class="border-b border-line bg-white px-6 py-5">
          <h1 class="text-2xl font-semibold text-ink">{props.title}</h1>
        </header>
        <div class="mx-auto max-w-7xl px-6 py-6">{props.children}</div>
      </main>
    </div>
  );
}

export function StatGrid(props: { settings: ProtocolSettings; providers: ProviderConfigSummary[]; orders: OrderSummary[] }) {
  const enabledProviders = props.providers.filter((provider) => provider.enabled).length;
  const paidOrders = props.orders.filter((order) => order.status === "paid").length;
  const enabledProtocols = [
    props.settings.routerpayApiEnabled,
    props.settings.easypayApiEnabled,
    props.settings.routerpayWebhookEnabled,
    props.settings.easypayNotifyEnabled
  ].filter(Boolean).length;

  return (
    <section class="grid gap-4 md:grid-cols-3">
      <Metric label="启用接口/回调" value={`${enabledProtocols}/4`} />
      <Metric label="启用渠道" value={String(enabledProviders)} />
      <Metric label="已支付订单" value={String(paidOrders)} />
    </section>
  );
}

export function Metric(props: { label: string; value: string }) {
  return (
    <div class="rounded-lg border border-line bg-white p-5 shadow-panel">
      <p class="text-sm font-medium text-muted">{props.label}</p>
      <p class="mt-3 text-3xl font-semibold text-ink">{props.value}</p>
    </div>
  );
}

export function ProtocolSwitches(props: { settings: ProtocolSettings }) {
  const rows = [
    ["RouterPay API", props.settings.routerpayApiEnabled],
    ["易支付兼容 API", props.settings.easypayApiEnabled],
    ["RouterPay Webhook", props.settings.routerpayWebhookEnabled],
    ["易支付 Notify/Return", props.settings.easypayNotifyEnabled]
  ];

  return (
    <section class="rounded-lg border border-line bg-white shadow-panel">
      <div class="border-b border-line px-5 py-4">
        <h2 class="text-base font-semibold text-ink">接口与回调开关</h2>
      </div>
      <div class="divide-y divide-line">
        {rows.map(([label, enabled]) => (
          <div class="flex items-center justify-between px-5 py-4">
            <span class="text-sm font-medium text-ink">{label}</span>
            <span
              class={`rounded-full px-3 py-1 text-xs font-semibold ${
                enabled ? "bg-emerald-100 text-success" : "bg-slate-100 text-muted"
              }`}
            >
              {enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProviderTable(props: { providers: ProviderConfigSummary[] }) {
  return (
    <section class="overflow-hidden rounded-lg border border-line bg-white shadow-panel">
      <div class="border-b border-line px-5 py-4">
        <h2 class="text-base font-semibold text-ink">支付渠道配置</h2>
      </div>
      <table class="w-full border-collapse text-left text-sm">
        <thead class="bg-panel text-xs uppercase text-muted">
          <tr>
            <th class="px-5 py-3">渠道</th>
            <th class="px-5 py-3">状态</th>
            <th class="px-5 py-3">模式</th>
            <th class="px-5 py-3">优先级</th>
            <th class="px-5 py-3">密钥</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          {props.providers.map((provider) => (
            <tr>
              <td class="px-5 py-4 font-medium text-ink">{provider.displayName}</td>
              <td class="px-5 py-4">{provider.enabled ? "启用" : "停用"}</td>
              <td class="px-5 py-4">{provider.testMode ? "测试" : "生产"}</td>
              <td class="px-5 py-4">{provider.priority}</td>
              <td class="px-5 py-4">{provider.secretConfigured ? "已配置" : "未配置"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function OrdersTable(props: { orders: OrderSummary[] }) {
  return (
    <section class="overflow-hidden rounded-lg border border-line bg-white shadow-panel">
      <div class="border-b border-line px-5 py-4">
        <h2 class="text-base font-semibold text-ink">订单</h2>
      </div>
      <table class="w-full border-collapse text-left text-sm">
        <thead class="bg-panel text-xs uppercase text-muted">
          <tr>
            <th class="px-5 py-3">RouterPay 订单</th>
            <th class="px-5 py-3">商户订单</th>
            <th class="px-5 py-3">协议</th>
            <th class="px-5 py-3">渠道</th>
            <th class="px-5 py-3">状态</th>
            <th class="px-5 py-3">金额</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          {props.orders.map((order) => (
            <tr>
              <td class="px-5 py-4 font-medium text-brand">
                <a href={`/admin/orders/${order.routerpayOrderId}`}>{order.routerpayOrderId}</a>
              </td>
              <td class="px-5 py-4 text-ink">{order.merchantOrderId}</td>
              <td class="px-5 py-4">{order.inboundProtocol}</td>
              <td class="px-5 py-4">{order.provider}</td>
              <td class="px-5 py-4">
                <span class={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[order.status]}`}>
                  {order.status}
                </span>
              </td>
              <td class="px-5 py-4">
                {(order.amountMinor / 100).toFixed(2)} {order.currency}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function CallbackTable(props: { deliveries: CallbackDeliverySummary[] }) {
  return (
    <section class="overflow-hidden rounded-lg border border-line bg-white shadow-panel">
      <div class="border-b border-line px-5 py-4">
        <h2 class="text-base font-semibold text-ink">回调投递</h2>
      </div>
      <table class="w-full border-collapse text-left text-sm">
        <thead class="bg-panel text-xs uppercase text-muted">
          <tr>
            <th class="px-5 py-3">投递 ID</th>
            <th class="px-5 py-3">订单</th>
            <th class="px-5 py-3">协议</th>
            <th class="px-5 py-3">目标</th>
            <th class="px-5 py-3">状态</th>
            <th class="px-5 py-3">次数</th>
            <th class="px-5 py-3">最近响应</th>
            <th class="px-5 py-3">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          {props.deliveries.map((delivery) => (
            <tr>
              <td class="px-5 py-4 font-medium text-ink">{delivery.id}</td>
              <td class="px-5 py-4">{delivery.routerpayOrderId}</td>
              <td class="px-5 py-4">{delivery.callbackProtocol}</td>
              <td class="max-w-[280px] truncate px-5 py-4" title={delivery.targetUrl}>
                {delivery.targetUrl}
              </td>
              <td class="px-5 py-4">{delivery.status}</td>
              <td class="px-5 py-4">{delivery.attempts}</td>
              <td class="max-w-[280px] px-5 py-4 text-muted">
                {delivery.lastStatusCode ? `HTTP ${delivery.lastStatusCode}` : delivery.lastError || "-"}
                {delivery.lastResponseSummary ? (
                  <span class="block truncate" title={delivery.lastResponseSummary}>
                    {delivery.lastResponseSummary}
                  </span>
                ) : null}
              </td>
              <td class="px-5 py-4">
                {delivery.status === "pending" || delivery.status === "failed" ? (
                  <form method="post" action={`/admin/callback-deliveries/${delivery.id}/retry`}>
                    <button class="rounded-md border border-line px-3 py-1 text-xs font-semibold text-ink hover:bg-panel">
                      补发
                    </button>
                  </form>
                ) : (
                  <span class="text-xs text-muted">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
