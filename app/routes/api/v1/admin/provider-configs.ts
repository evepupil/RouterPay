import { getDb } from "@/db/client";
import { listProviderConfigs, upsertProviderConfig } from "@/features/admin/repository";
import { providerConfigUpsertSchema } from "@/features/admin/schema";
import type { AppContext } from "@/types";
import { Hono } from "hono";

const app = new Hono<AppContext>();

app.get("/", async (c) => c.json(await listProviderConfigs(getDb(c))));
app.post("/", async (c) => {
  const body = providerConfigUpsertSchema.parse(await c.req.json());
  return c.json(await upsertProviderConfig(getDb(c), body), 201);
});
app.put("/:provider_config_id", async (c) => {
  const id = c.req.param("provider_config_id");

  if (!id) {
    return c.json({ error: { code: "bad_request", message: "Missing provider config id" } }, 400);
  }

  const body = providerConfigUpsertSchema.parse(await c.req.json());
  return c.json(await upsertProviderConfig(getDb(c), { id, ...body }));
});

export default app;
