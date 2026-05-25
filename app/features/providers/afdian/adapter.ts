import type {
  NormalizedPaymentEvent,
  PaymentProvider,
  VerifiedProviderEvent,
  VerifyWebhookInput
} from "../types";

export const afdianProvider: PaymentProvider = {
  name: "afdian",
  async createPayment(input) {
    const paymentUrl = readConfigString(input.providerConfig, "paymentUrl") || "https://afdian.com";
    const paymentCode = input.paymentCode;

    return {
      routerpayOrderId: "",
      paymentUrl,
      paymentCode,
      paymentInstructions: paymentCode ? `请在爱发电付款备注中填写：${paymentCode}` : "请按页面提示完成爱发电付款"
    };
  },
  async verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedProviderEvent> {
    const payload = parseJsonPayload(input.rawBody);
    const order = readOrderPayload(payload);
    const providerTradeNo =
      readString(order, "out_trade_no") ??
      readString(order, "trade_no") ??
      readString(payload, "provider_trade_no") ??
      input.headers.get("x-afdian-trade-no") ??
      "";
    const remark = readString(order, "remark") ?? readString(order, "user_remark") ?? readString(order, "show_amount");
    const eventKey =
      input.headers.get("x-afdian-event-id") ??
      (providerTradeNo || readString(payload, "event_id") || crypto.randomUUID());

    return {
      provider: "afdian",
      eventKey,
      providerTradeNo,
      paymentCode: extractPaymentCode(remark),
      raw: payload ?? input.rawBody
    };
  },
  async normalizeEvent(event: VerifiedProviderEvent): Promise<NormalizedPaymentEvent> {
    const payload = typeof event.raw === "object" && event.raw ? event.raw : undefined;
    const order = readOrderPayload(payload);

    return {
      provider: "afdian",
      providerTradeNo: event.providerTradeNo,
      status: normalizeStatus(readString(order, "status") ?? readString(payload, "status")),
      amountMinor: readAmountMinor(order) ?? readAmountMinor(payload) ?? 0,
      currency: "CNY",
      paidAt: readString(order, "paid_time") ?? readString(order, "paid_at") ?? new Date().toISOString()
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
  if (typeof value === "string" && value) {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return undefined;
}

function readAmountMinor(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const amountMinor = record.amount_minor;

  if (typeof amountMinor === "number" && Number.isInteger(amountMinor) && amountMinor > 0) {
    return amountMinor;
  }

  const totalAmount = record.total_amount ?? record.show_amount;

  if (typeof totalAmount === "string" && /^\d+(\.\d{1,2})?$/.test(totalAmount)) {
    const [integerPart, fractionPart = ""] = totalAmount.split(".");
    return Number.parseInt(integerPart, 10) * 100 + Number.parseInt(fractionPart.padEnd(2, "0").slice(0, 2), 10);
  }

  if (typeof totalAmount === "number" && Number.isFinite(totalAmount)) {
    return Math.round(totalAmount * 100);
  }

  return undefined;
}

function normalizeStatus(value: string | undefined): NormalizedPaymentEvent["status"] {
  if (!value || value === "paid" || value === "TRADE_SUCCESS" || value === "2") {
    return "paid";
  }

  if (value === "pending" || value === "created" || value === "failed" || value === "expired" || value === "closed") {
    return value;
  }

  return "paid";
}

function readOrderPayload(payload: unknown): Record<string, unknown> | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const data = record.data;

  if (data && typeof data === "object") {
    const order = (data as Record<string, unknown>).order;
    if (order && typeof order === "object") {
      return order as Record<string, unknown>;
    }
  }

  const order = record.order;
  return order && typeof order === "object" ? (order as Record<string, unknown>) : record;
}

export function extractPaymentCode(value: string | undefined): string | undefined {
  return value?.match(/\bRP[A-Z0-9]{8}\b/i)?.[0]?.toUpperCase();
}

function readConfigString(config: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = config?.[key];
  return typeof value === "string" && value ? value : undefined;
}
