import { AdminShell, MerchantSecurityPanel } from "@/features/admin/components";
import { getDb } from "@/db/client";
import { resetRouterPayApiKey } from "@/features/admin/repository";
import { createRoute } from "honox/factory";

export const POST = createRoute(async (c) => {
  const result = await resetRouterPayApiKey(getDb(c));

  return c.render(
    <AdminShell title="商户安全">
      <MerchantSecurityPanel settings={result.settings} newApiKey={result.apiKey} />
    </AdminShell>,
    { title: "商户安全" }
  );
});
