import { AdminShell, ProviderTable } from "@/features/admin/components";
import { getDb } from "@/db/client";
import { listProviderConfigs } from "@/features/admin/repository";
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
  const providers = await listProviderConfigs(getDb(c));

  return c.render(
    <AdminShell title="支付渠道配置">
      <ProviderTable providers={providers} />
    </AdminShell>,
    { title: "支付渠道配置" }
  );
});
