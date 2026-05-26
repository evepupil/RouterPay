import {
  AdminShell,
  CallbackTable,
  TrendCard,
  OrdersTable,
  ProviderHealth,
  ProtocolSwitches,
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
        <div class="grid gap-6 xl:grid-cols-[420px_1fr]">
          <ProtocolSwitches settings={settings} />
          <TrendCard
            title="交易趋势"
            total="¥18,420.00"
            detail="最近 14 天"
            values={[8, 12, 9, 18, 16, 22, 24, 21, 28, 32, 26, 34, 37, 42]}
          />
        </div>
        <ProviderHealth providers={providers} />
        <OrdersTable orders={orderRows.slice(0, 8)} compact />
        <CallbackTable deliveries={deliveries.slice(0, 8)} compact />
      </div>
    </AdminShell>,
    { title: "Admin" }
  );
});
