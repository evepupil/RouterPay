import { getPaymentProvider } from "@/features/providers/registry";
import type { PaymentProviderName } from "@/shared/types";
import { Hono } from "hono";

const app = new Hono();

app.post("/", async (c) => {
  const providerName = c.req.param("provider") as PaymentProviderName;
  const provider = getPaymentProvider(providerName);

  if (!provider) {
    return c.json({ error: { code: "provider_not_found", message: "Provider is not configured" } }, 404);
  }

  const rawBody = await c.req.text();
  const verified = await provider.verifyWebhook({ headers: c.req.raw.headers, rawBody });
  const event = await provider.normalizeEvent(verified);

  return c.json({ received: true, event });
});

export default app;
