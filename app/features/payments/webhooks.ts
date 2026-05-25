import type { createDb } from "@/db/client";
import type { PaymentProviderName } from "@/shared/types";
import { getPaymentProvider } from "@/features/providers/registry";
import {
  applyNormalizedPaymentEvent,
  createCallbackDeliveryRecords,
  findOrderByProviderTradeNo,
  recordProviderEvent
} from "./repository";

export type ProviderWebhookResult = {
  received: true;
  duplicate: boolean;
  provider: PaymentProviderName;
  eventKey: string;
  providerTradeNo: string;
  routerpayOrderId?: string;
  eventId?: string;
  callbackDeliveryCount: number;
};

export class ProviderWebhookError extends Error {
  constructor(
    message: string,
    public readonly code: "provider_not_found" | "order_not_found"
  ) {
    super(message);
  }
}

export async function handleProviderWebhook(
  db: ReturnType<typeof createDb>,
  input: {
    providerName: PaymentProviderName;
    headers: Headers;
    rawBody: string;
  }
): Promise<ProviderWebhookResult> {
  const provider = getPaymentProvider(input.providerName);

  if (!provider) {
    throw new ProviderWebhookError("Provider is not configured", "provider_not_found");
  }

  const verified = await provider.verifyWebhook({ headers: input.headers, rawBody: input.rawBody });
  const recorded = await recordProviderEvent(db, verified, input.rawBody);

  if (!recorded.inserted) {
    return {
      received: true,
      duplicate: true,
      provider: verified.provider,
      eventKey: verified.eventKey,
      providerTradeNo: verified.providerTradeNo,
      callbackDeliveryCount: 0
    };
  }

  const normalized = await provider.normalizeEvent(verified);
  const order = await findOrderByProviderTradeNo(db, normalized.provider, normalized.providerTradeNo);

  if (!order) {
    throw new ProviderWebhookError("Order not found for provider trade number", "order_not_found");
  }

  const paymentEvent = await applyNormalizedPaymentEvent(db, order, normalized);
  const callbackDeliveries = await createCallbackDeliveryRecords(db, order, paymentEvent);

  return {
    received: true,
    duplicate: false,
    provider: verified.provider,
    eventKey: verified.eventKey,
    providerTradeNo: verified.providerTradeNo,
    routerpayOrderId: order.routerpayOrderId,
    eventId: paymentEvent.eventId,
    callbackDeliveryCount: callbackDeliveries.length
  };
}
