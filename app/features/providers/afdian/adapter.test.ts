import { describe, expect, it } from "vitest";
import { afdianProvider } from "./adapter";

describe("afdian provider stub", () => {
  it("returns a stable provider trade number for created payments", async () => {
    const result = await afdianProvider.createPayment({
      merchantId: "m_default",
      merchantOrderId: "biz_1001",
      inboundProtocol: "routerpay",
      amountMinor: 1000,
      currency: "CNY",
      orderName: "Test order",
      metadata: {}
    });

    expect(result.providerTradeNo).toBe("afdian_biz_1001");
    expect(result.paymentUrl).toContain("out_trade_no=biz_1001");
  });

  it("normalizes JSON webhook payloads into payment events", async () => {
    const verified = await afdianProvider.verifyWebhook({
      headers: new Headers({ "x-afdian-event-id": "evt_1001" }),
      rawBody: JSON.stringify({
        provider_trade_no: "afdian_biz_1001",
        status: "TRADE_SUCCESS",
        amount_minor: 1000,
        currency: "CNY",
        paid_at: "2026-05-25T12:00:00.000Z"
      })
    });
    const normalized = await afdianProvider.normalizeEvent(verified);

    expect(verified.eventKey).toBe("evt_1001");
    expect(verified.providerTradeNo).toBe("afdian_biz_1001");
    expect(normalized).toEqual({
      provider: "afdian",
      providerTradeNo: "afdian_biz_1001",
      status: "paid",
      amountMinor: 1000,
      currency: "CNY",
      paidAt: "2026-05-25T12:00:00.000Z"
    });
  });
});
