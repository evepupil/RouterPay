import { AdminShell, OrdersTable } from "@/features/admin/components";
import { orders } from "@/shared/mock-data";
import { createRoute } from "honox/factory";

export default createRoute((c) => {
  return c.render(
    <AdminShell title="订单">
      <OrdersTable orders={orders} />
    </AdminShell>,
    { title: "订单" }
  );
});
