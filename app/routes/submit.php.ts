import { createPayment } from "@/features/payments/service";
import { easypayProtocolAdapter } from "@/features/protocols/easypay/adapter";
import { getDb } from "@/db/client";
import { AuthError, verifyEasyPaySign } from "@/features/merchants/auth";
import type { AppContext } from "@/types";
import type { Context } from "hono";
import { Hono } from "hono";

const app = new Hono<AppContext>();

app.get("/", async (c) => handleEasyPay(c));
app.post("/", async (c) => handleEasyPay(c));

async function handleEasyPay(c: Context) {
  try {
    const rawBody =
      c.req.method === "POST" ? Object.fromEntries(await c.req.formData()) : Object.fromEntries(new URL(c.req.url).searchParams);
    const body = normalizeStringRecord(rawBody);
    const db = getDb(c);
    await verifyEasyPaySign(db, body);
    const input = await easypayProtocolAdapter.parseCreatePayment({
      method: c.req.method,
      url: c.req.url,
      headers: c.req.raw.headers,
      body
    });
    const result = await createPayment(db, input);

    return easypayProtocolAdapter.formatCreatePaymentResult(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return c.text("fail", 401);
    }

    throw error;
  }
}

function normalizeStringRecord(input: Record<string, FormDataEntryValue | string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, typeof value === "string" ? value : value.name])
  );
}

export default app;
