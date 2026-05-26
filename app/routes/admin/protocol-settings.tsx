import { AdminShell, ProtocolSwitches, Section } from "@/features/admin/components";
import { getDb } from "@/db/client";
import { getProtocolSettings } from "@/features/admin/repository";
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
  const settings = await getProtocolSettings(getDb(c));

  return c.render(
    <AdminShell title="接口开关">
      <div class="space-y-6">
        <ProtocolSwitches settings={settings} detailed />
        <Section title="回调重试">
          <div class="divide-y divide-line">
            {[
              ["失败自动重试", true],
              ["签名校验", true],
              ["测试模式放行", false]
            ].map(([label, enabled]) => (
              <div class="flex items-center justify-between px-5 py-4">
                <p class="text-sm font-semibold text-ink">{label}</p>
                <label class="toggle">
                  <input type="checkbox" checked={Boolean(enabled)} />
                  <span />
                </label>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AdminShell>,
    { title: "接口开关" }
  );
});
