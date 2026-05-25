import { getDb } from "@/db/client";
import { listOrders, listProviderConfigs } from "@/features/admin/repository";
import type { AppContext } from "@/types";
import { Hono } from "hono";

const app = new Hono<AppContext>();

app.get("/", async (c) => {
  const db = getDb(c);
  const [orderRows, providers] = await Promise.all([listOrders(db), listProviderConfigs(db)]);

  return c.json({
    orderCount: orderRows.length,
    providerCount: providers.length,
    paidOrderCount: orderRows.filter((order) => order.status === "paid").length
  });
});

export default app;
