import { AdminShell, ProviderTable } from "@/features/admin/components";
import { getDb } from "@/db/client";
import { listProviderConfigs, upsertProviderConfig } from "@/features/admin/repository";
import type { PaymentProviderName } from "@/shared/types";
import { createRoute } from "honox/factory";

export const POST = createRoute(async (c) => {
  const form = await c.req.parseBody();
  const id = c.req.param("provider_config_id");

  await upsertProviderConfig(getDb(c), {
    id,
    provider: stringValue(form.provider) as PaymentProviderName,
    displayName: stringValue(form.displayName) || "",
    enabled: stringValue(form.enabled) === "true",
    testMode: stringValue(form.testMode) === "true",
    priority: Number.parseInt(stringValue(form.priority) || "100", 10),
    secretRef: stringValue(form.secretRef),
    config: {
      paymentUrl: stringValue(form.paymentUrl) || "",
      userId: stringValue(form.userId) || "",
      apiToken: stringValue(form.apiToken) || undefined,
      matchMode: stringValue(form.matchMode) || "remark_code"
    }
  });

  return c.redirect("/admin/provider-configs", 303);
});

export default createRoute(async (c) => {
  const providers = await listProviderConfigs(getDb(c));

  return c.render(
    <AdminShell title="支付渠道配置">
      <ProviderTable providers={providers} />
    </AdminShell>,
    { title: "支付渠道配置" }
  );
});

function stringValue(value: FormDataEntryValue | FormDataEntryValue[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  return undefined;
}
