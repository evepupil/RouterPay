import { AdminShell, ProtocolSwitches } from "@/features/admin/components";
import { protocolSettings } from "@/shared/mock-data";
import { createRoute } from "honox/factory";

export default createRoute((c) => {
  return c.render(
    <AdminShell title="接口开关">
      <ProtocolSwitches settings={protocolSettings} />
    </AdminShell>,
    { title: "接口开关" }
  );
});
