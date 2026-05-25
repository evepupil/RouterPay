import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    ok: true,
    service: "routerpay",
    runtime: "cloudflare-workers"
  });
});

export default app;
