import { protocolSettings } from "@/shared/mock-data";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.json(protocolSettings));
app.put("/", async (c) => {
  const body = await c.req.json();
  return c.json({ ...protocolSettings, ...body });
});

export default app;
