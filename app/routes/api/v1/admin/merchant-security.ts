import { getDb } from "@/db/client";
import {
  getMerchantSecuritySettings,
  resetRouterPayApiKey,
  updateMerchantSecuritySettings
} from "@/features/admin/repository";
import { merchantSecurityUpdateSchema } from "@/features/admin/schema";
import type { AppContext } from "@/types";
import { Hono } from "hono";

const app = new Hono<AppContext>();

app.get("/", async (c) => c.json(await getMerchantSecuritySettings(getDb(c))));

app.put("/", async (c) => {
  const body = merchantSecurityUpdateSchema.parse(await c.req.json());
  return c.json(
    await updateMerchantSecuritySettings(
      getDb(c),
      {
        ...body,
        webhookSecret: body.webhookSecret || undefined,
        easypayKey: body.easypayKey || undefined
      },
      c.env.ROUTERPAY_SECRET_ENCRYPTION_KEY
    )
  );
});

app.post("/routerpay-api-key/reset", async (c) => c.json(await resetRouterPayApiKey(getDb(c))));

export default app;
