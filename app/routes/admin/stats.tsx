import { AdminShell, Metric } from "@/features/admin/components";
import { orders, providerConfigs } from "@/shared/mock-data";
import { createRoute } from "honox/factory";

export default createRoute((c) => {
  return c.render(
    <AdminShell title="统计面板">
      <section class="grid gap-4 md:grid-cols-3">
        <Metric label="订单数" value={String(orders.length)} />
        <Metric label="渠道数" value={String(providerConfigs.length)} />
        <Metric label="成功率" value="50%" />
      </section>
    </AdminShell>,
    { title: "统计面板" }
  );
});
