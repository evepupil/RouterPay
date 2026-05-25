import {
  AdminShell,
  CallbackTable,
  OrdersTable,
  ProtocolSwitches,
  ProviderTable,
  StatGrid
} from "@/features/admin/components";
import { getDb } from "@/db/client";
import {
  getProtocolSettings,
  listCallbackDeliveries,
  listOrders,
  listProviderConfigs
} from "@/features/admin/repository";
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
  const db = getDb(c);
  const [settings, providers, orderRows, deliveries] = await Promise.all([
    getProtocolSettings(db),
    listProviderConfigs(db),
    listOrders(db),
    listCallbackDeliveries(db)
  ]);

  return c.render(
    <AdminShell title="运行总览">
      <div class="space-y-6">
        <StatGrid settings={settings} providers={providers} orders={orderRows} />
        <div class="grid gap-6 xl:grid-cols-[360px_1fr]">
          <ProtocolSwitches settings={settings} />
          <ProviderTable providers={providers} />
        </div>
        <OrdersTable orders={orderRows} />
        <CallbackTable deliveries={deliveries} />
      </div>
    </AdminShell>,
    { title: "Admin" }
  );
});
