import {
  AdminShell,
  CallbackTable,
  OrdersTable,
  ProtocolSwitches,
  ProviderTable,
  StatGrid
} from "@/features/admin/components";
import { callbackDeliveries, orders, protocolSettings, providerConfigs } from "@/shared/mock-data";
import { createRoute } from "honox/factory";

export default createRoute((c) => {
  return c.render(
    <AdminShell title="运行总览">
      <div class="space-y-6">
        <StatGrid settings={protocolSettings} providers={providerConfigs} orders={orders} />
        <div class="grid gap-6 xl:grid-cols-[360px_1fr]">
          <ProtocolSwitches settings={protocolSettings} />
          <ProviderTable providers={providerConfigs} />
        </div>
        <OrdersTable orders={orders} />
        <CallbackTable deliveries={callbackDeliveries} />
      </div>
    </AdminShell>,
    { title: "Admin" }
  );
});
