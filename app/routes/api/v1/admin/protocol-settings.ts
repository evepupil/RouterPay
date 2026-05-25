import { getDb } from "@/db/client";
import { getProtocolSettings, updateProtocolSettings } from "@/features/admin/repository";
import type { AppContext } from "@/types";
import { Hono } from "hono";

const app = new Hono<AppContext>();

app.get("/", async (c) => c.json(await getProtocolSettings(getDb(c))));
app.put("/", async (c) => {
  const body = await c.req.json();
  return c.json(await updateProtocolSettings(getDb(c), body));
});

export default app;
