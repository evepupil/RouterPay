import { getDb } from "@/db/client";
import { CallbackDeliveryError, retryCallbackDelivery } from "@/features/webhooks/delivery";
import type { AppContext } from "@/types";
import { Hono } from "hono";

const app = new Hono<AppContext>();

app.post("/", async (c) => {
  const deliveryId = c.req.param("delivery_id");

  if (!deliveryId) {
    return c.json({ error: { code: "bad_request", message: "Missing delivery id" } }, 400);
  }

  try {
    const result = await retryCallbackDelivery(getDb(c), deliveryId, {
      routerpayWebhookSecret: c.env.ROUTERPAY_WEBHOOK_SECRET
    });

    return c.json(result);
  } catch (error) {
    if (error instanceof CallbackDeliveryError) {
      return c.json({ error: { code: error.code, message: error.message } }, 404);
    }

    throw error;
  }
});

export default app;
