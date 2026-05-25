import { AdminShell, OrdersTable } from "@/features/admin/components";
import { getDb } from "@/db/client";
import { listOrders } from "@/features/admin/repository";
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
  const orderRows = await listOrders(getDb(c));

  return c.render(
    <AdminShell title="订单">
      <OrdersTable orders={orderRows} />
    </AdminShell>,
    { title: "订单" }
  );
});
