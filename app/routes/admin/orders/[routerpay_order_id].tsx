import {
  AdminShell,
  CallbackTable,
  CopyButton,
  EmptyState,
  OrderDetailCard,
  PaymentTimeline,
  Section
} from "@/features/admin/components";
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
          <OrderDetailCard order={order} />
          <div class="grid gap-6 xl:grid-cols-[1fr_380px]">
            <PaymentTimeline order={order} />
            <Section title="操作">
              <div class="space-y-3 p-5">
                <CopyButton value={order.routerpayOrderId} variant="primary">复制 RouterPay 订单号</CopyButton>
                <CopyButton value={order.merchantOrderId}>复制商户订单号</CopyButton>
                <a class="button-secondary w-full justify-center" href="/admin/orders">
                  返回订单列表
                </a>
              </div>
            </Section>
          </div>
          <CallbackTable deliveries={deliveries} />
        </div>
      ) : (
        <section class="panel">
          <EmptyState title="订单不存在" description="没有找到对应的 RouterPay 订单，可能已被删除或订单号有误。" />
        </section>
      )}
    </AdminShell>,
    { title: "订单详情" }
  );
});
