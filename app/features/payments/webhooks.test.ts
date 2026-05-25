import { callbackDeliveries, orders, paymentEvents, providerEvents } from "@/db/schema";
import { updateMerchantSecuritySettings } from "@/features/admin/repository";
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
        "content-type": "application/json"
      });
      expect((init?.headers as Record<string, string>)["routerpay-signature"]).toMatch(/^v1=/);
      expect(String(init?.body)).toContain('"status":"paid"');

      return new Response("accepted", { status: 200 });
    });

    await updateMerchantSecuritySettings(
      testDb.db,
      {
        webhookSecret: "merchant-secret-2001"
      },
      "encryption-key-2001"
    );
    const created = await createPayment(testDb.db, {
      merchantId: "m_default",
      merchantOrderId: "biz_2001",
      inboundProtocol: "routerpay",
      provider: "afdian",
      amountMinor: 1200,
      currency: "CNY",
      orderName: "Integration order",
      notifyUrl: "https://merchant.example/notify",
      metadata: {
        planId: "basic"
      }
    });
    const firstResult = await handleProviderWebhook(testDb.db, {
      providerName: "afdian",
      headers: new Headers({ "x-afdian-event-id": "afdian_evt_2001" }),
      rawBody: JSON.stringify({
        provider_trade_no: "afdian_biz_2001",
        status: "TRADE_SUCCESS",
        amount_minor: 1200,
        currency: "CNY",
        paid_at: "2026-05-25T12:00:00.000Z"
      }),
      fetchImpl,
      secretEncryptionKey: "encryption-key-2001"
    });
    const repeatedResult = await handleProviderWebhook(testDb.db, {
      providerName: "afdian",
      headers: new Headers({ "x-afdian-event-id": "afdian_evt_2001" }),
      rawBody: JSON.stringify({
        provider_trade_no: "afdian_biz_2001",
        status: "TRADE_SUCCESS",
        amount_minor: 1200,
        currency: "CNY",
        paid_at: "2026-05-25T12:00:00.000Z"
      }),
      fetchImpl,
      secretEncryptionKey: "encryption-key-2001"
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
    expect(order.providerTradeNo).toBe("afdian_biz_2001");
    expect(providerEventRows).toHaveLength(1);
    expect(paymentEventRows).toHaveLength(1);
    expect(deliveryRows).toHaveLength(1);
    expect(deliveryRows[0]).toMatchObject({
      status: "delivered",
      attempts: 1,
      lastStatusCode: 200,
      lastResponseSummary: "accepted"
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
