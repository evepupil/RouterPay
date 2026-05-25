import { orders } from "@/shared/mock-data";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.json(orders));
app.get("/:routerpay_order_id", (c) => {
  const order = orders.find((item) => item.routerpayOrderId === c.req.param("routerpay_order_id"));
  return order ? c.json(order) : c.json({ error: { code: "not_found", message: "Order not found" } }, 404);
});

export default app;
