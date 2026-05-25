import { AdminShell, MerchantSecurityPanel } from "@/features/admin/components";
import { getDb } from "@/db/client";
import {
  getMerchantSecuritySettings,
  updateMerchantSecuritySettings
} from "@/features/admin/repository";
import type { AppContext } from "@/types";
import { createRoute } from "honox/factory";

export const POST = createRoute(async (c) => {
  const form = await c.req.parseBody();
  const db = getDb(c);
  await updateMerchantSecuritySettings(
    db,
    {
      name: stringValue(form.name),
      webhookUrl: stringValue(form.webhookUrl),
      webhookSecret: stringValue(form.webhookSecret),
      easypayPid: stringValue(form.easypayPid),
      easypayKey: stringValue(form.easypayKey)
    },
    envOf(c).ROUTERPAY_SECRET_ENCRYPTION_KEY
  );

  return c.redirect("/admin/merchant-security", 303);
});

export default createRoute(async (c) => {
  const settings = await getMerchantSecuritySettings(getDb(c));

  return c.render(
    <AdminShell title="商户安全">
      <MerchantSecurityPanel settings={settings} />
    </AdminShell>,
    { title: "商户安全" }
  );
});

function stringValue(value: FormDataEntryValue | FormDataEntryValue[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

function envOf(c: unknown): AppContext["Bindings"] {
  return ((c as { env?: AppContext["Bindings"] }).env ?? {}) as AppContext["Bindings"];
}
