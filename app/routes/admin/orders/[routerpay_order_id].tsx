import { AdminShell, CallbackTable } from "@/features/admin/components";
import { getDb } from "@/db/client";
import { getOrder, listCallbackDeliveries } from "@/features/admin/repository";
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
  const orderId = c.req.param("routerpay_order_id") ?? "";
  const db = getDb(c);
  const [order, deliveries] = await Promise.all([getOrder(db, orderId), listCallbackDeliveries(db, orderId)]);

  return c.render(
    <AdminShell title="订单详情">
      {order ? (
        <div class="space-y-6">
          <section class="rounded-lg border border-line bg-white p-5 shadow-panel">
            <h2 class="text-base font-semibold text-ink">{order.routerpayOrderId}</h2>
            <dl class="mt-4 grid gap-4 text-sm md:grid-cols-3">
              <div>
                <dt class="text-muted">商户订单</dt>
                <dd class="mt-1 font-medium text-ink">{order.merchantOrderId}</dd>
              </div>
              <div>
                <dt class="text-muted">状态</dt>
                <dd class="mt-1 font-medium text-ink">{order.status}</dd>
              </div>
              <div>
                <dt class="text-muted">金额</dt>
                <dd class="mt-1 font-medium text-ink">
                  {(order.amountMinor / 100).toFixed(2)} {order.currency}
                </dd>
              </div>
            </dl>
          </section>
          <CallbackTable deliveries={deliveries} />
        </div>
      ) : (
        <section class="rounded-lg border border-line bg-white p-5 shadow-panel">
          <p class="text-sm text-muted">订单不存在。</p>
        </section>
      )}
    </AdminShell>,
    { title: "订单详情" }
  );
});
