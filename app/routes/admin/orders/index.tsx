import { AdminShell, OrdersControls, OrdersTable } from "@/features/admin/components";
import { getDb } from "@/db/client";
import { listOrders } from "@/features/admin/repository";
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
  const orderRows = await listOrders(getDb(c));
  const query = c.req.query("q")?.trim().toLowerCase() ?? "";
  const status = c.req.query("status") ?? "";
  const protocol = c.req.query("protocol") ?? "";
  const filteredOrders = orderRows.filter((order) => {
    const matchesQuery =
      !query ||
      order.routerpayOrderId.toLowerCase().includes(query) ||
      order.merchantOrderId.toLowerCase().includes(query);
    const matchesStatus = !status || order.status === status;
    const matchesProtocol = !protocol || order.inboundProtocol === protocol;

    return matchesQuery && matchesStatus && matchesProtocol;
  });

  return c.render(
    <AdminShell title="订单">
      <div class="space-y-6">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="panel p-5">
            <p class="text-sm font-medium text-muted">全部订单</p>
            <p class="mt-3 text-3xl font-semibold text-ink">{orderRows.length}</p>
          </div>
          <div class="panel p-5">
            <p class="text-sm font-medium text-muted">已支付</p>
            <p class="mt-3 text-3xl font-semibold text-ink">
              {orderRows.filter((order) => order.status === "paid").length}
            </p>
          </div>
          <div class="panel p-5">
            <p class="text-sm font-medium text-muted">待处理</p>
            <p class="mt-3 text-3xl font-semibold text-ink">
              {orderRows.filter((order) => order.status === "created" || order.status === "pending").length}
            </p>
          </div>
        </div>
        <OrdersTable orders={filteredOrders} filters={<OrdersControls query={query} status={status} protocol={protocol} />} />
      </div>
    </AdminShell>,
    { title: "订单" }
  );
});
