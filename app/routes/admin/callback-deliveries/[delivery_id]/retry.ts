import { getDb } from "@/db/client";
import { CallbackDeliveryError, retryCallbackDelivery } from "@/features/webhooks/delivery";
import type { AppContext } from "@/types";
import { Hono } from "hono";

const app = new Hono<AppContext>();

app.post("/", async (c) => {
  const redirectTo = c.req.header("referer") ?? "/admin/callbacks";
  const deliveryId = c.req.param("delivery_id");

  if (!deliveryId) {
    return c.redirect(redirectTo, 303);
  }

  try {
    await retryCallbackDelivery(getDb(c), deliveryId, {
      routerpayWebhookSecret: c.env.ROUTERPAY_WEBHOOK_SECRET
    });
  } catch (error) {
    if (!(error instanceof CallbackDeliveryError)) {
      throw error;
    }
  }

  return c.redirect(redirectTo, 303);
});

export default app;
