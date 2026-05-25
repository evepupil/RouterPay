import { createPayment } from "@/features/payments/service";
import { easypayProtocolAdapter } from "@/features/protocols/easypay/adapter";
import type { Context } from "hono";
import { Hono } from "hono";

const app = new Hono();

app.get("/", async (c) => handleEasyPay(c));
app.post("/", async (c) => handleEasyPay(c));

async function handleEasyPay(c: Context) {
  const body = c.req.method === "POST" ? Object.fromEntries(await c.req.formData()) : Object.fromEntries(new URL(c.req.url).searchParams);
  const input = await easypayProtocolAdapter.parseCreatePayment({
    method: c.req.method,
    url: c.req.url,
    headers: c.req.raw.headers,
    body
  });
  const result = await createPayment(input);

  return easypayProtocolAdapter.formatCreatePaymentResult(result);
}

export default app;
