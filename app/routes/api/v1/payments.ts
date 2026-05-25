import { createPayment } from "@/features/payments/service";
import { routerpayProtocolAdapter } from "@/features/protocols/routerpay/adapter";
import { Hono } from "hono";

const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.json();
  const input = await routerpayProtocolAdapter.parseCreatePayment({
    method: c.req.method,
    url: c.req.url,
    headers: c.req.raw.headers,
    body
  });
  const result = await createPayment(input);

  return routerpayProtocolAdapter.formatCreatePaymentResult(result);
});

export default app;
