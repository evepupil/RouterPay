import { describe, expect, it } from "vitest";
import { afdianProvider } from "./adapter";

describe("afdian provider", () => {
  it("returns configured payment links and remark instructions", async () => {
    const result = await afdianProvider.createPayment({
      merchantId: "m_default",
      merchantOrderId: "biz_1001",
      inboundProtocol: "routerpay",
      amountMinor: 1000,
      currency: "CNY",
      orderName: "Test order",
      metadata: {},
      paymentCode: "RPABC12345",
      providerConfig: {
        paymentUrl: "https://afdian.com/a/routerpay"
      }
    });

    expect(result.paymentUrl).toBe("https://afdian.com/a/routerpay");
    expect(result.paymentCode).toBe("RPABC12345");
    expect(result.paymentInstructions).toContain("RPABC12345");
  });

  it("normalizes afdian webhook payloads into payment events", async () => {
    const verified = await afdianProvider.verifyWebhook({
      headers: new Headers(),
      rawBody: JSON.stringify({
        ec: 200,
        em: "ok",
        data: {
          type: "order",
          order: {
            out_trade_no: "202605250001",
            total_amount: "10.00",
            status: 2,
            remark: "RouterPay RPABC12345"
          }
        }
      })
    });
    const normalized = await afdianProvider.normalizeEvent(verified);

    expect(verified.eventKey).toBe("202605250001");
    expect(verified.providerTradeNo).toBe("202605250001");
    expect(verified.paymentCode).toBe("RPABC12345");
    expect(normalized).toMatchObject({
      provider: "afdian",
      providerTradeNo: "202605250001",
      status: "paid",
      amountMinor: 1000,
      currency: "CNY"
    });
  });
});
