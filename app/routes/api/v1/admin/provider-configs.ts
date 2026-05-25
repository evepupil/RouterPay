import { providerConfigs } from "@/shared/mock-data";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.json(providerConfigs));
app.post("/", async (c) => {
  const body = await c.req.json();
  return c.json({ id: crypto.randomUUID(), ...body }, 201);
});
app.put("/:provider_config_id", async (c) => {
  const body = await c.req.json();
  return c.json({ id: c.req.param("provider_config_id"), ...body });
});

export default app;
