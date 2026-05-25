import { AdminShell, ProviderTable } from "@/features/admin/components";
import { providerConfigs } from "@/shared/mock-data";
import { createRoute } from "honox/factory";

export default createRoute((c) => {
  return c.render(
    <AdminShell title="支付渠道配置">
      <ProviderTable providers={providerConfigs} />
    </AdminShell>,
    { title: "支付渠道配置" }
  );
});
