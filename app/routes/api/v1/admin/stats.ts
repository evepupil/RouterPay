import { orders, providerConfigs } from "@/shared/mock-data";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    orderCount: orders.length,
    providerCount: providerConfigs.length,
    paidOrderCount: orders.filter((order) => order.status === "paid").length
  });
});

export default app;
