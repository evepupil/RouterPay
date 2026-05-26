import { callbackDeliveries, orders, paymentEvents, providerEvents } from "@/db/schema";
import { createPayment } from "@/features/payments/service";
import { handleProviderWebhook } from "@/features/payments/webhooks";
import { createTestDb } from "@/test/d1";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

const databases: Array<{ dispose(): Promise<void> }> = [];

afterEach(async () => {
  while (databases.length > 0) {
    await databases.pop()?.dispose();
  }
});

describe("provider webhook flow", () => {
  it("creates a payment event, delivers the callback, and deduplicates repeated provider events", async () => {
    const testDb = await createTestDb();
    databases.push(testDb);
    const fetchImpl = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.headers).toMatchObject({
        "content-type": "application/x-www-form-urlencoded"
      });
      expect(String(init?.body)).toContain("trade_status=TRADE_SUCCESS");
      expect(String(init?.body)).toContain("out_trade_no=biz_2001");

      return new Response("success", { status: 200 });
    });

    const created = await createPayment(testDb.db, {
      merchantId: "m_default",
      merchantOrderId: "biz_2001",
      inboundProtocol: "easypay",
      provider: "afdian",
      amountMinor: 1200,
      currency: "CNY",
      orderName: "Integration order",
      notifyUrl: "https://merchant.example/notify",
      metadata: {
        easypayType: "alipay"
      }
    });
    expect(created.paymentCode).toMatch(/^RP[A-Z0-9]{8}$/);
    const firstResult = await handleProviderWebhook(testDb.db, {
      providerName: "afdian",
      headers: new Headers(),
      rawBody: JSON.stringify({
        ec: 200,
        em: "ok",
        data: {
          type: "order",
          order: {
            out_trade_no: "afdian_trade_2001",
            total_amount: "12.00",
            status: 2,
            remark: `RouterPay ${created.paymentCode}`
          }
        }
      }),
      fetchImpl
    });
    const repeatedResult = await handleProviderWebhook(testDb.db, {
      providerName: "afdian",
      headers: new Headers(),
      rawBody: JSON.stringify({
        ec: 200,
        em: "ok",
        data: {
          type: "order",
          order: {
            out_trade_no: "afdian_trade_2001",
            total_amount: "12.00",
            status: 2,
            remark: `RouterPay ${created.paymentCode}`
          }
        }
      }),
      fetchImpl
    });

    const [order] = await testDb.db.select().from(orders).where(eq(orders.routerpayOrderId, created.routerpayOrderId));
    const providerEventRows = await testDb.db.select().from(providerEvents);
    const paymentEventRows = await testDb.db.select().from(paymentEvents);
    const deliveryRows = await testDb.db.select().from(callbackDeliveries);

    expect(firstResult).toMatchObject({
      duplicate: false,
      routerpayOrderId: created.routerpayOrderId,
      callbackDeliveryCount: 1,
      deliveredCallbackCount: 1
    });
    expect(repeatedResult).toMatchObject({
      duplicate: true,
      callbackDeliveryCount: 0
    });
    expect(order.status).toBe("paid");
    expect(order.providerTradeNo).toBe("afdian_trade_2001");
    expect(providerEventRows).toHaveLength(1);
    expect(paymentEventRows).toHaveLength(1);
    expect(deliveryRows).toHaveLength(1);
    expect(deliveryRows[0]).toMatchObject({
      status: "delivered",
      attempts: 1,
      lastStatusCode: 200,
      lastResponseSummary: "success"
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  }, 15000);
});
