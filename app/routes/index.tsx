import { createRoute } from "honox/factory";

const items = [
  ["原生接口", "RouterPay JSON API"],
  ["兼容接口", "EasyPay submit.php"],
  ["支付渠道", "Afdian"],
  ["数据存储", "Cloudflare D1"]
];

export default createRoute((c) => {
  return c.render(
    <main class="min-h-screen bg-white text-ink">
      <section class="hero-mesh">
        <header class="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-8">
          <a class="flex items-center gap-3" href="/">
            <span class="grid h-9 w-9 place-items-center rounded-lg bg-[linear-gradient(135deg,#635bff,#00d4ff)] text-sm font-black text-white shadow-brand">
              RP
            </span>
            <span class="text-base font-semibold tracking-tight text-ink">RouterPay</span>
          </a>
          <a class="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white shadow-soft" href="/admin">
            打开后台
          </a>
        </header>

        <div class="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 md:px-8 lg:grid-cols-[1fr_520px] lg:items-center lg:pb-24 lg:pt-16">
          <div>
            <h1 class="max-w-4xl text-5xl font-semibold tracking-tight text-ink md:text-6xl lg:text-7xl">
              RouterPay
            </h1>
            <p class="mt-6 max-w-2xl text-lg leading-8 text-muted">支付路由、订单记录、渠道配置和回调投递管理。</p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a class="rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white shadow-brand" href="/admin">
                进入后台
              </a>
              <a class="rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink shadow-soft" href="/api/v1/health">
                健康检查
              </a>
            </div>
          </div>

          <div class="code-window">
            <div class="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span class="h-3 w-3 rounded-full bg-danger" />
              <span class="h-3 w-3 rounded-full bg-warning" />
              <span class="h-3 w-3 rounded-full bg-success" />
              <span class="ml-2 text-xs font-semibold text-white/55">创建支付</span>
            </div>
            <pre>{`POST /api/v1/payments
Authorization: Bearer rp_dev_key

{
  "merchantOrderId": "DEMO-001",
  "amountMinor": 12900,
  "currency": "CNY",
  "orderName": "Pro plan",
  "provider": "afdian"
}`}</pre>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map(([label, value]) => (
            <article class="panel p-5">
              <p class="text-sm font-medium text-muted">{label}</p>
              <p class="mt-3 text-xl font-semibold text-ink">{value}</p>
            </article>
          ))}
        </div>
      </section>
    </main>,
    { title: "RouterPay" }
  );
});
