import type { createDb } from "@/db/client";
import type { PaymentProviderName } from "@/shared/types";
import { getPaymentProvider } from "@/features/providers/registry";
import type { DeliveryFetch } from "@/features/webhooks/delivery";
import { deliverCallbacks } from "@/features/webhooks/delivery";
import {
  applyNormalizedPaymentEvent,
  attachProviderTradeNoToOrder,
  createCallbackDeliveryRecords,
  findPendingOrderByAmount,
  findPendingOrderByPaymentCode,
  findOrderByProviderTradeNo,
  recordProviderEvent
} from "./repository";
import { getProviderConfigByProvider } from "@/features/admin/repository";

export type ProviderWebhookResult = {
  received: true;
  duplicate: boolean;
  provider: PaymentProviderName;
  eventKey: string;
  providerTradeNo: string;
  routerpayOrderId?: string;
  eventId?: string;
  callbackDeliveryCount: number;
  deliveredCallbackCount?: number;
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
    fetchImpl?: DeliveryFetch;
    routerpayWebhookSecret?: string;
    secretEncryptionKey?: string;
    easypayNotifyKey?: string;
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
  let order = normalized.providerTradeNo
    ? await findOrderByProviderTradeNo(db, normalized.provider, normalized.providerTradeNo)
    : undefined;

  if (!order && verified.paymentCode) {
    order = await findPendingOrderByPaymentCode(db, normalized.provider, verified.paymentCode);

    if (order && normalized.providerTradeNo) {
      await attachProviderTradeNoToOrder(db, order.routerpayOrderId, normalized.providerTradeNo);
    }
  }

  if (!order && normalized.amountMinor > 0) {
    const providerConfig = await getProviderConfigByProvider(db, normalized.provider);
    if (providerConfig?.config.matchMode === "amount_time_window") {
      order = await findPendingOrderByAmount(db, normalized.provider, normalized.amountMinor, normalized.currency);

      if (order && normalized.providerTradeNo) {
        await attachProviderTradeNoToOrder(db, order.routerpayOrderId, normalized.providerTradeNo);
      }
    }
  }

  if (!order) {
    throw new ProviderWebhookError("Order not found for provider trade number", "order_not_found");
  }

  const paymentEvent = await applyNormalizedPaymentEvent(db, order, normalized);
  const callbackDeliveries = await createCallbackDeliveryRecords(db, order, paymentEvent);
  const deliveryResults = await deliverCallbacks(
    db,
    callbackDeliveries.map((delivery) => delivery.id),
    {
      fetchImpl: input.fetchImpl,
      routerpayWebhookSecret: input.routerpayWebhookSecret,
      secretEncryptionKey: input.secretEncryptionKey,
      easypayNotifyKey: input.easypayNotifyKey
    }
  );

  return {
    received: true,
    duplicate: false,
    provider: verified.provider,
    eventKey: verified.eventKey,
    providerTradeNo: verified.providerTradeNo,
    routerpayOrderId: order.routerpayOrderId,
    eventId: paymentEvent.eventId,
    callbackDeliveryCount: callbackDeliveries.length,
    deliveredCallbackCount: deliveryResults.filter((result) => result.delivered).length
  };
}
