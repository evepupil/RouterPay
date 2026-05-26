import { AdminShell, CallbackControls, CallbackTable } from "@/features/admin/components";
import { getDb } from "@/db/client";
import { listCallbackDeliveries } from "@/features/admin/repository";
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
  const deliveries = await listCallbackDeliveries(getDb(c));
  const query = c.req.query("q")?.trim().toLowerCase() ?? "";
  const status = c.req.query("status") ?? "";
  const protocol = c.req.query("protocol") ?? "";
  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesQuery =
      !query ||
      delivery.id.toLowerCase().includes(query) ||
      delivery.routerpayOrderId.toLowerCase().includes(query);
    const matchesStatus = !status || delivery.status === status;
    const matchesProtocol = !protocol || delivery.callbackProtocol === protocol;

    return matchesQuery && matchesStatus && matchesProtocol;
  });

  return c.render(
    <AdminShell title="回调投递">
      <div class="space-y-6">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="panel p-5">
            <p class="text-sm font-medium text-muted">全部投递</p>
            <p class="mt-3 text-3xl font-semibold text-ink">{deliveries.length}</p>
          </div>
          <div class="panel p-5">
            <p class="text-sm font-medium text-muted">已送达</p>
            <p class="mt-3 text-3xl font-semibold text-ink">
              {deliveries.filter((delivery) => delivery.status === "delivered").length}
            </p>
          </div>
          <div class="panel p-5">
            <p class="text-sm font-medium text-muted">待重试</p>
            <p class="mt-3 text-3xl font-semibold text-ink">
              {deliveries.filter((delivery) => delivery.status === "pending").length}
            </p>
          </div>
        </div>
        <CallbackTable
          deliveries={filteredDeliveries}
          filters={<CallbackControls query={query} status={status} protocol={protocol} />}
        />
      </div>
    </AdminShell>,
    { title: "回调投递" }
  );
});
