import { AdminShell, ProviderTable } from "@/features/admin/components";
import { getDb } from "@/db/client";
import { listProviderConfigs } from "@/features/admin/repository";
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
  const providers = await listProviderConfigs(getDb(c));

  return c.render(
    <AdminShell title="支付渠道">
      <div class="space-y-6">
        <ProviderTable providers={providers} />
      </div>
    </AdminShell>,
    { title: "支付渠道配置" }
  );
});
