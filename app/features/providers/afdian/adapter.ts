import type {
  NormalizedPaymentEvent,
  PaymentProvider,
  VerifiedProviderEvent,
  VerifyWebhookInput
} from "../types";

export const afdianProvider: PaymentProvider = {
  name: "afdian",
  async createPayment(input) {
    const providerTradeNo = `afdian_${input.merchantOrderId}`;

    return {
      routerpayOrderId: `rp_${input.merchantOrderId}`,
      providerTradeNo,
      paymentUrl: `https://afdian.com/order/create?out_trade_no=${encodeURIComponent(input.merchantOrderId)}`
    };
  },
  async verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedProviderEvent> {
    const payload = parseJsonPayload(input.rawBody);
    const providerTradeNo =
      readString(payload, "provider_trade_no") ??
      readString(payload, "out_trade_no") ??
      input.headers.get("x-afdian-trade-no") ??
      "";

    return {
      provider: "afdian",
      eventKey: input.headers.get("x-afdian-event-id") ?? readString(payload, "event_id") ?? crypto.randomUUID(),
      providerTradeNo,
      raw: payload ?? input.rawBody
    };
  },
  async normalizeEvent(event: VerifiedProviderEvent): Promise<NormalizedPaymentEvent> {
    const payload = typeof event.raw === "object" && event.raw ? event.raw : undefined;

    return {
      provider: "afdian",
      providerTradeNo: event.providerTradeNo,
      status: normalizeStatus(readString(payload, "status")),
      amountMinor: readAmountMinor(payload) ?? 0,
      currency: readString(payload, "currency") ?? "CNY",
      paidAt: readString(payload, "paid_at") ?? new Date().toISOString()
    };
  }
};

function parseJsonPayload(rawBody: string): Record<string, unknown> | undefined {
  if (!rawBody.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawBody);
    return typeof parsed === "object" && parsed ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

function readString(payload: unknown, key: string): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" && value ? value : undefined;
}

function readAmountMinor(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const value = (payload as Record<string, unknown>).amount_minor;
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function normalizeStatus(value: string | undefined): NormalizedPaymentEvent["status"] {
  if (!value || value === "paid" || value === "TRADE_SUCCESS") {
    return "paid";
  }

  if (value === "pending" || value === "created" || value === "failed" || value === "expired" || value === "closed") {
    return value;
  }

  return "paid";
}
