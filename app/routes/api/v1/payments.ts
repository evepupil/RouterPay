import { createPayment } from "@/features/payments/service";
import { routerpayProtocolAdapter } from "@/features/protocols/routerpay/adapter";
import { getDb } from "@/db/client";
import { AuthError, verifyRouterPayBearer } from "@/features/merchants/auth";
import type { AppContext } from "@/types";
import { Hono } from "hono";

const app = new Hono<AppContext>();

app.post("/", async (c) => {
  try {
    const db = getDb(c);
    const merchant = await verifyRouterPayBearer(db, c.req.header("authorization") ?? null);
    const body = await c.req.json();
    const input = await routerpayProtocolAdapter.parseCreatePayment({
      method: c.req.method,
      url: c.req.url,
      headers: c.req.raw.headers,
      body: {
        ...body,
        merchantId: merchant.merchantId
      }
    });
    const result = await createPayment(db, input);

    return routerpayProtocolAdapter.formatCreatePaymentResult(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return c.json({ error: { code: error.code, message: error.message } }, 401);
    }

    throw error;
  }
});

export default app;
