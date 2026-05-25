import { AdminShell, CallbackTable } from "@/features/admin/components";
import { getDb } from "@/db/client";
import { listCallbackDeliveries } from "@/features/admin/repository";
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
  const deliveries = await listCallbackDeliveries(getDb(c));

  return c.render(
    <AdminShell title="回调投递">
      <CallbackTable deliveries={deliveries} />
    </AdminShell>,
    { title: "回调投递" }
  );
});
