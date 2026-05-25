import { getDb } from "@/db/client";
import { handleProviderWebhook, ProviderWebhookError } from "@/features/payments/webhooks";
import type { PaymentProviderName } from "@/shared/types";
import type { AppContext } from "@/types";
import { Hono } from "hono";

const app = new Hono<AppContext>();

app.post("/", async (c) => {
  const providerName = c.req.param("provider") as PaymentProviderName;
  const rawBody = await c.req.text();

  try {
    const result = await handleProviderWebhook(getDb(c), {
      providerName,
      headers: c.req.raw.headers,
      rawBody,
      secretEncryptionKey: c.env.ROUTERPAY_SECRET_ENCRYPTION_KEY
    });

    return c.json(result);
  } catch (error) {
    if (error instanceof ProviderWebhookError) {
      const status = error.code === "provider_not_found" ? 404 : 202;
      return c.json({ error: { code: error.code, message: error.message } }, status);
    }

    throw error;
  }
});

export default app;
