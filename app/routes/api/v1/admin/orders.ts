import { getDb } from "@/db/client";
import { getOrder, listOrders } from "@/features/admin/repository";
import type { AppContext } from "@/types";
import { Hono } from "hono";

const app = new Hono<AppContext>();

app.get("/", async (c) => c.json(await listOrders(getDb(c))));
app.get("/:routerpay_order_id", async (c) => {
  const order = await getOrder(getDb(c), c.req.param("routerpay_order_id"));
  return order ? c.json(order) : c.json({ error: { code: "not_found", message: "Order not found" } }, 404);
});

export default app;
