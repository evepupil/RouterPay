import { createDb } from "@/db/client";
import { callbackDeliveries, orders, paymentEvents, providerEvents } from "@/db/schema";
import { DEFAULT_MERCHANT_ID, ensureDefaultMerchant } from "@/features/admin/repository";
import type { NormalizedPaymentEvent, VerifiedProviderEvent } from "@/features/providers/types";
import type { CreatePaymentInput } from "@/features/protocols/types";
import { and, eq } from "drizzle-orm";

export async function createOrReuseOrder(db: ReturnType<typeof createDb>, input: CreatePaymentInput) {
  await ensureDefaultMerchant(db);

  const merchantId = input.merchantId || DEFAULT_MERCHANT_ID;
  const existing = await db.query.orders.findFirst({
    where: and(
      eq(orders.merchantId, merchantId),
      eq(orders.inboundProtocol, input.inboundProtocol),
      eq(orders.merchantOrderId, input.merchantOrderId)
    )
  });

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const routerpayOrderId = `rp_${crypto.randomUUID().replaceAll("-", "")}`;
  const value = {
    routerpayOrderId,
    merchantId,
    merchantOrderId: input.merchantOrderId,
    inboundProtocol: input.inboundProtocol,
    provider: input.provider ?? "afdian",
    status: "created",
    amountMinor: input.amountMinor,
    currency: input.currency,
    orderName: input.orderName,
    notifyUrl: input.notifyUrl,
    returnUrl: input.returnUrl,
    metadataJson: JSON.stringify(input.metadata),
    createdAt: now,
    updatedAt: now
  };

  await db.insert(orders).values(value);

  return value;
}

export async function attachProviderTradeNo(
  db: ReturnType<typeof createDb>,
  routerpayOrderId: string,
  providerTradeNo: string | undefined
) {
  if (!providerTradeNo) {
    return;
  }

  await db
    .update(orders)
    .set({
      providerTradeNo,
      status: "pending",
      updatedAt: new Date().toISOString()
    })
    .where(eq(orders.routerpayOrderId, routerpayOrderId));
}

export async function recordProviderEvent(
  db: ReturnType<typeof createDb>,
  event: VerifiedProviderEvent,
  rawPayload: string
) {
  const value = {
    id: `pevt_${crypto.randomUUID().replaceAll("-", "")}`,
    provider: event.provider,
    eventKey: event.eventKey,
    providerTradeNo: event.providerTradeNo,
    signatureValid: true,
    rawPayload
  };

  await db.insert(providerEvents).values(value).onConflictDoNothing();

  const row = await db.query.providerEvents.findFirst({
    where: and(eq(providerEvents.provider, event.provider), eq(providerEvents.eventKey, event.eventKey))
  });

  return {
    event: row,
    inserted: row?.id === value.id
  };
}

export async function findOrderByProviderTradeNo(
  db: ReturnType<typeof createDb>,
  provider: string,
  providerTradeNo: string
) {
  return db.query.orders.findFirst({
    where: and(eq(orders.provider, provider), eq(orders.providerTradeNo, providerTradeNo))
  });
}

export async function applyNormalizedPaymentEvent(
  db: ReturnType<typeof createDb>,
  order: typeof orders.$inferSelect,
  event: NormalizedPaymentEvent
) {
  const now = new Date().toISOString();
  const eventId = `evt_${crypto.randomUUID().replaceAll("-", "")}`;
  const eventType = `payment.${event.status}`;

  await db
    .update(orders)
    .set({
      status: event.status,
      amountMinor: event.amountMinor || order.amountMinor,
      currency: event.currency || order.currency,
      paidAt: event.paidAt ?? order.paidAt,
      updatedAt: now
    })
    .where(eq(orders.routerpayOrderId, order.routerpayOrderId));

  await db.insert(paymentEvents).values({
    eventId,
    routerpayOrderId: order.routerpayOrderId,
    eventType,
    status: event.status,
    amountMinor: event.amountMinor || order.amountMinor,
    currency: event.currency || order.currency,
    occurredAt: event.paidAt ?? now,
    createdAt: now
  });

  return {
    eventId,
    eventType
  };
}

export async function createCallbackDeliveryRecords(
  db: ReturnType<typeof createDb>,
  order: typeof orders.$inferSelect,
  paymentEvent: { eventId: string }
) {
  const now = new Date().toISOString();
  const values = order.notifyUrl
    ? [
        {
          id: `cdlv_${crypto.randomUUID().replaceAll("-", "")}`,
          eventId: paymentEvent.eventId,
          routerpayOrderId: order.routerpayOrderId,
          callbackProtocol: order.inboundProtocol === "easypay" ? "easypay_notify" : "routerpay_webhook",
          targetUrl: order.notifyUrl,
          status: "pending",
          attempts: 0,
          createdAt: now,
          updatedAt: now
        }
      ]
    : [];

  if (values.length > 0) {
    await db.insert(callbackDeliveries).values(values);
  }

  return values;
}
