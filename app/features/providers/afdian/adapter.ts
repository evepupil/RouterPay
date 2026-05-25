import type {
  NormalizedPaymentEvent,
  PaymentProvider,
  VerifiedProviderEvent,
  VerifyWebhookInput
} from "../types";

export const afdianProvider: PaymentProvider = {
  name: "afdian",
  async createPayment(input) {
    return {
      routerpayOrderId: `rp_${input.merchantOrderId}`,
      paymentUrl: `https://afdian.com/order/create?out_trade_no=${encodeURIComponent(input.merchantOrderId)}`
    };
  },
  async verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedProviderEvent> {
    return {
      provider: "afdian",
      eventKey: input.headers.get("x-afdian-event-id") ?? crypto.randomUUID(),
      providerTradeNo: crypto.randomUUID(),
      raw: input.rawBody
    };
  },
  async normalizeEvent(event: VerifiedProviderEvent): Promise<NormalizedPaymentEvent> {
    return {
      provider: "afdian",
      providerTradeNo: event.providerTradeNo,
      status: "paid",
      amountMinor: 0,
      currency: "CNY",
      paidAt: new Date().toISOString()
    };
  }
};
