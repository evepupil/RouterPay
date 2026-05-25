import type { createDb } from "@/db/client";
import { callbackDeliveries, orders, paymentEvents } from "@/db/schema";
import { ensureDefaultMerchant, getMerchantWebhookSecret } from "@/features/admin/repository";
import { createEasyPaySign } from "@/features/merchants/auth";
import { getCredentialByMerchantId } from "@/features/merchants/repository";
import { createRouterPayWebhookHeaders } from "./signing";
import { and, eq, inArray } from "drizzle-orm";

const DEFAULT_ROUTERPAY_WEBHOOK_SECRET = "routerpay_dev_webhook_secret";
const DEFAULT_EASYPAY_NOTIFY_KEY = "easypay_dev_key";
const MAX_RESPONSE_SUMMARY_LENGTH = 500;
const MAX_ERROR_LENGTH = 500;

export type DeliveryFetch = typeof fetch;

export class CallbackDeliveryError extends Error {
  constructor(
    message: string,
    public readonly code: "not_found" | "event_not_found" | "order_not_found"
  ) {
    super(message);
  }
}

export async function deliverCallback(
  db: ReturnType<typeof createDb>,
  deliveryId: string,
  options: {
    fetchImpl?: DeliveryFetch;
    routerpayWebhookSecret?: string;
    secretEncryptionKey?: string;
    easypayNotifyKey?: string;
  } = {}
) {
  const delivery = await db.query.callbackDeliveries.findFirst({
    where: eq(callbackDeliveries.id, deliveryId)
  });

  if (!delivery) {
    throw new CallbackDeliveryError("Callback delivery not found", "not_found");
  }

  const paymentEvent = await db.query.paymentEvents.findFirst({
    where: eq(paymentEvents.eventId, delivery.eventId)
  });

  if (!paymentEvent) {
    throw new CallbackDeliveryError("Payment event not found", "event_not_found");
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.routerpayOrderId, delivery.routerpayOrderId)
  });

  if (!order) {
    throw new CallbackDeliveryError("Order not found", "order_not_found");
  }

  const request = await buildCallbackRequest({
    db,
    delivery,
    order,
    paymentEvent,
    routerpayWebhookSecret: options.routerpayWebhookSecret,
    secretEncryptionKey: options.secretEncryptionKey,
    easypayNotifyKey: options.easypayNotifyKey ?? DEFAULT_EASYPAY_NOTIFY_KEY
  });

  const fetchImpl = options.fetchImpl ?? fetch;
  const nextAttempts = delivery.attempts + 1;
  const now = new Date().toISOString();

  try {
    const response = await fetchImpl(delivery.targetUrl, {
      method: "POST",
      headers: request.headers,
      body: request.body
    });
    const responseText = await response.text();
    const delivered = isDeliverySuccessful(delivery.callbackProtocol, response, responseText);

    await db
      .update(callbackDeliveries)
      .set({
        status: delivered ? "delivered" : "failed",
        attempts: nextAttempts,
        lastStatusCode: response.status,
        lastResponseSummary: summarize(responseText),
        lastError: delivered ? null : deliveryFailureMessage(delivery.callbackProtocol, response, responseText),
        nextRetryAt: delivered ? null : nextRetryAt(nextAttempts),
        updatedAt: now
      })
      .where(eq(callbackDeliveries.id, delivery.id));

    return {
      id: delivery.id,
      delivered,
      statusCode: response.status,
      attempts: nextAttempts
    };
  } catch (error) {
    await db
      .update(callbackDeliveries)
      .set({
        status: "failed",
        attempts: nextAttempts,
        lastStatusCode: null,
        lastResponseSummary: null,
        lastError: summarize(error instanceof Error ? error.message : String(error), MAX_ERROR_LENGTH),
        nextRetryAt: nextRetryAt(nextAttempts),
        updatedAt: now
      })
      .where(eq(callbackDeliveries.id, delivery.id));

    return {
      id: delivery.id,
      delivered: false,
      attempts: nextAttempts
    };
  }
}

export async function deliverCallbacks(
  db: ReturnType<typeof createDb>,
  deliveryIds: string[],
  options: Parameters<typeof deliverCallback>[2] = {}
) {
  const results = [];

  for (const deliveryId of deliveryIds) {
    results.push(await deliverCallback(db, deliveryId, options));
  }

  return results;
}

export async function retryCallbackDelivery(
  db: ReturnType<typeof createDb>,
  deliveryId: string,
  options: Parameters<typeof deliverCallback>[2] = {}
) {
  await db
    .update(callbackDeliveries)
    .set({
      status: "pending",
      nextRetryAt: null,
      updatedAt: new Date().toISOString()
    })
    .where(eq(callbackDeliveries.id, deliveryId));

  return deliverCallback(db, deliveryId, options);
}

export async function retryCallbackDeliveriesForOrder(
  db: ReturnType<typeof createDb>,
  routerpayOrderId: string,
  options: Parameters<typeof deliverCallback>[2] = {}
) {
  await ensureDefaultMerchant(db);
  const rows = await db
    .select({ id: callbackDeliveries.id })
    .from(callbackDeliveries)
    .where(
      and(
        eq(callbackDeliveries.routerpayOrderId, routerpayOrderId),
        inArray(callbackDeliveries.status, ["pending", "failed"])
      )
    );

  return deliverCallbacks(
    db,
    rows.map((row) => row.id),
    options
  );
}

async function buildCallbackRequest(input: {
  db: ReturnType<typeof createDb>;
  delivery: typeof callbackDeliveries.$inferSelect;
  order: typeof orders.$inferSelect;
  paymentEvent: typeof paymentEvents.$inferSelect;
  routerpayWebhookSecret?: string;
  secretEncryptionKey?: string;
  easypayNotifyKey: string;
}) {
  if (input.delivery.callbackProtocol === "easypay_notify") {
    const credential = await getCredentialByMerchantId(input.db, "easypay_key", input.order.merchantId);
    const params = {
      pid: credential?.publicKey ?? input.order.merchantId,
      trade_no: input.order.routerpayOrderId,
      out_trade_no: input.order.merchantOrderId,
      type: readMetadataValue(input.order.metadataJson, "easypayType") ?? "unknown",
      name: input.order.orderName,
      money: (input.order.amountMinor / 100).toFixed(2),
      trade_status: input.paymentEvent.status === "paid" ? "TRADE_SUCCESS" : input.paymentEvent.status
    };
    const sign = await createEasyPaySign(params, credential?.secretHash ?? input.easypayNotifyKey);
    const body = new URLSearchParams({
      ...params,
      sign,
      sign_type: "MD5"
    }).toString();

    return {
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body
    };
  }

  const body = JSON.stringify({
    event_id: input.paymentEvent.eventId,
    event_type: input.paymentEvent.eventType,
    merchant_id: input.order.merchantId,
    merchant_order_id: input.order.merchantOrderId,
    routerpay_order_id: input.order.routerpayOrderId,
    provider: input.order.provider,
    provider_trade_no: input.order.providerTradeNo,
    status: input.paymentEvent.status,
    amount: input.paymentEvent.amountMinor,
    currency: input.paymentEvent.currency,
    paid_at: input.order.paidAt,
    metadata: parseMetadata(input.order.metadataJson)
  });
  const webhookSecret =
    input.routerpayWebhookSecret ||
    (await getMerchantWebhookSecret(input.db, input.order.merchantId, input.secretEncryptionKey)) ||
    DEFAULT_ROUTERPAY_WEBHOOK_SECRET;

  return {
    headers: await createRouterPayWebhookHeaders({
      body,
      secret: webhookSecret
    }),
    body
  };
}

function parseMetadata(metadataJson: string): Record<string, unknown> {
  try {
    const value = JSON.parse(metadataJson);
    return typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function readMetadataValue(metadataJson: string, key: string): string | undefined {
  const value = parseMetadata(metadataJson)[key];
  return typeof value === "string" && value ? value : undefined;
}

function summarize(value: string, maxLength = MAX_RESPONSE_SUMMARY_LENGTH): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

function nextRetryAt(attempts: number): string {
  const delaySeconds = Math.min(60 * 60, 60 * 2 ** Math.max(0, attempts - 1));
  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}

function isDeliverySuccessful(protocol: string, response: Response, body: string): boolean {
  if (!response.ok) {
    return false;
  }

  if (protocol === "easypay_notify") {
    return body.trim().toLowerCase() === "success";
  }

  return true;
}

function deliveryFailureMessage(protocol: string, response: Response, body: string): string {
  if (!response.ok) {
    return `HTTP ${response.status}`;
  }

  if (protocol === "easypay_notify") {
    return `Expected success response, got: ${summarize(body, 120) || "empty body"}`;
  }

  return `HTTP ${response.status}`;
}
