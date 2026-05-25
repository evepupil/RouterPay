import { AdminShell, CallbackTable } from "@/features/admin/components";
import { callbackDeliveries } from "@/shared/mock-data";
import { createRoute } from "honox/factory";

export default createRoute((c) => {
  return c.render(
    <AdminShell title="回调投递">
      <CallbackTable deliveries={callbackDeliveries} />
    </AdminShell>,
    { title: "回调投递" }
  );
});
