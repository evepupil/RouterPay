import { getDb } from "@/db/client";
import { syncAfdianOrders } from "@/features/providers/afdian/sync";
import type { AppContext } from "@/types";
import { Hono } from "hono";

const app = new Hono<AppContext>();

app.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const page = typeof body.page === "number" ? body.page : 1;

  return c.json(
    await syncAfdianOrders(getDb(c), {
      page,
      secretEncryptionKey: c.env.ROUTERPAY_SECRET_ENCRYPTION_KEY
    })
  );
});

export default app;
