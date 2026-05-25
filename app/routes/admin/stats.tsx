import { AdminShell, Metric } from "@/features/admin/components";
import { getDb } from "@/db/client";
import { listOrders, listProviderConfigs } from "@/features/admin/repository";
import { createRoute } from "honox/factory";

export default createRoute(async (c) => {
  const db = getDb(c);
  const [orderRows, providers] = await Promise.all([listOrders(db), listProviderConfigs(db)]);

  return c.render(
    <AdminShell title="统计面板">
      <section class="grid gap-4 md:grid-cols-3">
        <Metric label="订单数" value={String(orderRows.length)} />
        <Metric label="渠道数" value={String(providers.length)} />
        <Metric
          label="成功率"
          value={orderRows.length ? `${Math.round((orderRows.filter((order) => order.status === "paid").length / orderRows.length) * 100)}%` : "0%"}
        />
      </section>
    </AdminShell>,
    { title: "统计面板" }
  );
});
