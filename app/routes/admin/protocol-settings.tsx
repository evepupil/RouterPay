import { AdminShell, ProtocolSwitches } from "@/features/admin/components";
import { getDb } from "@/db/client";
import { getProtocolSettings } from "@/features/admin/repository";
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
  const settings = await getProtocolSettings(getDb(c));

  return c.render(
    <AdminShell title="接口开关">
      <ProtocolSwitches settings={settings} />
    </AdminShell>,
    { title: "接口开关" }
  );
});
