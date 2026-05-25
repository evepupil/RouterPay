import { getDb } from "@/db/client";
import { listProviderConfigs } from "@/features/admin/repository";
import type { AppContext } from "@/types";
import { Hono } from "hono";

const app = new Hono<AppContext>();

app.get("/", async (c) => c.json(await listProviderConfigs(getDb(c))));
app.post("/", async (c) => {
  const body = await c.req.json();
  return c.json({ id: crypto.randomUUID(), ...body }, 201);
});
app.put("/:provider_config_id", async (c) => {
  const body = await c.req.json();
  return c.json({ id: c.req.param("provider_config_id"), ...body });
});

export default app;
