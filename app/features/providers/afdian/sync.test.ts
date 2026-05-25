import { upsertProviderConfig } from "@/features/admin/repository";
import { createPayment } from "@/features/payments/service";
import { syncAfdianOrders } from "@/features/providers/afdian/sync";
import { createTestDb } from "@/test/d1";
import { describe, expect, it, vi } from "vitest";

describe("syncAfdianOrders", () => {
  it("processes queried Afdian orders through the provider webhook flow", async () => {
    const testDb = await createTestDb();
    await upsertProviderConfig(testDb.db, {
      provider: "afdian",
      displayName: "Afdian",
      enabled: true,
      testMode: true,
      priority: 10,
      config: {
        userId: "afdian-user",
        apiToken: "afdian-token"
      }
    });
    const created = await createPayment(testDb.db, {
      merchantId: "m_default",
      merchantOrderId: "biz_sync_1001",
      inboundProtocol: "easypay",
      provider: "afdian",
      amountMinor: 990,
      currency: "CNY",
      orderName: "Synced order",
      notifyUrl: "https://merchant.example/notify",
      metadata: {
        easypayType: "alipay"
      }
    });
    const fetchImpl = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes("/api/open/query-order")) {
        return Response.json({
          ec: 200,
          em: "ok",
          data: {
            list: [
              {
                out_trade_no: "afdian_sync_1001",
                total_amount: "9.90",
                status: 2,
                remark: `RouterPay ${created.paymentCode}`
              }
            ]
          }
        });
      }

      return new Response("success", { status: 200 });
    });

    await expect(syncAfdianOrders(testDb.db, { fetchImpl })).resolves.toEqual({
      processed: 1,
      matched: 1
    });
  });

  it("surfaces Afdian API errors instead of treating them as empty order pages", async () => {
    const testDb = await createTestDb();
    await upsertProviderConfig(testDb.db, {
      provider: "afdian",
      displayName: "Afdian",
      enabled: true,
      testMode: true,
      priority: 10,
      config: {
        userId: "afdian-user",
        apiToken: "afdian-token"
      }
    });
    const fetchImpl = vi.fn(async () =>
      Response.json({
        ec: 400005,
        em: "sign validation failed"
      })
    );

    await expect(syncAfdianOrders(testDb.db, { fetchImpl })).rejects.toThrow(
      "Afdian order sync failed: sign validation failed"
    );
  });
});
