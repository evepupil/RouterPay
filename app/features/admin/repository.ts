import { createDb } from "@/db/client";
import {
  callbackDeliveries,
  merchantApiCredentials,
  merchants,
  orders,
  protocolSettings,
  providerConfigs
} from "@/db/schema";
import { sha256Hex } from "@/lib/crypto";
import type {
  CallbackDeliverySummary,
  OrderSummary,
  PaymentProviderName,
  ProtocolSettings,
  ProviderConfigSummary,
  RouterPayOrderStatus
} from "@/shared/types";
import { and, asc, desc, eq } from "drizzle-orm";

export const DEFAULT_MERCHANT_ID = "m_default";
export const DEV_ROUTERPAY_API_KEY = "rp_dev_key";
export const DEV_EASYPAY_PID = "m_default";
export const DEV_EASYPAY_KEY = "easypay_dev_key";

export async function ensureDefaultMerchant(db: ReturnType<typeof createDb>) {
  await db
    .insert(merchants)
    .values({
      id: DEFAULT_MERCHANT_ID,
      name: "Default Merchant",
      webhookUrl: "https://example.com/routerpay/webhook",
      status: "active"
    })
    .onConflictDoNothing();

  await db
    .insert(protocolSettings)
    .values({
      merchantId: DEFAULT_MERCHANT_ID,
      routerpayApiEnabled: true,
      easypayApiEnabled: true,
      routerpayWebhookEnabled: true,
      easypayNotifyEnabled: true
    })
    .onConflictDoNothing();

  const routerpayApiKeyHash = await sha256Hex(DEV_ROUTERPAY_API_KEY);
  await ensureCredential(db, {
      id: "cred_routerpay_default",
      merchantId: DEFAULT_MERCHANT_ID,
      credentialType: "routerpay_api_key",
      publicKey: routerpayApiKeyHash,
      secretHash: routerpayApiKeyHash
  });

  await ensureCredential(db, {
      id: "cred_easypay_default",
      merchantId: DEFAULT_MERCHANT_ID,
      credentialType: "easypay_key",
      publicKey: DEV_EASYPAY_PID,
      secretHash: DEV_EASYPAY_KEY
  });

  await db
    .insert(providerConfigs)
    .values({
      id: "pcfg_afdian_default",
      merchantId: DEFAULT_MERCHANT_ID,
      provider: "afdian",
      displayName: "Afdian",
      enabled: true,
      testMode: true,
      priority: 10,
      secretRef: "worker-secret:AFDIAN_TOKEN"
    })
    .onConflictDoNothing();
}

async function ensureCredential(db: ReturnType<typeof createDb>, value: typeof merchantApiCredentials.$inferInsert) {
  const existing = await db.query.merchantApiCredentials.findFirst({
    where: and(
      eq(merchantApiCredentials.credentialType, value.credentialType),
      eq(merchantApiCredentials.publicKey, value.publicKey)
    )
  });

  if (!existing) {
    await db.insert(merchantApiCredentials).values(value);
  }
}

export async function getProtocolSettings(db: ReturnType<typeof createDb>): Promise<ProtocolSettings> {
  await ensureDefaultMerchant(db);
  const row = await db.query.protocolSettings.findFirst({
    where: eq(protocolSettings.merchantId, DEFAULT_MERCHANT_ID)
  });

  return {
    routerpayApiEnabled: row?.routerpayApiEnabled ?? false,
    easypayApiEnabled: row?.easypayApiEnabled ?? false,
    routerpayWebhookEnabled: row?.routerpayWebhookEnabled ?? false,
    easypayNotifyEnabled: row?.easypayNotifyEnabled ?? false
  };
}

export async function updateProtocolSettings(
  db: ReturnType<typeof createDb>,
  patch: Partial<ProtocolSettings>
): Promise<ProtocolSettings> {
  await ensureDefaultMerchant(db);
  await db
    .update(protocolSettings)
    .set({
      ...patch,
      updatedAt: new Date().toISOString()
    })
    .where(eq(protocolSettings.merchantId, DEFAULT_MERCHANT_ID));

  return getProtocolSettings(db);
}

export async function listProviderConfigs(db: ReturnType<typeof createDb>): Promise<ProviderConfigSummary[]> {
  await ensureDefaultMerchant(db);
  const rows = await db
    .select()
    .from(providerConfigs)
    .where(eq(providerConfigs.merchantId, DEFAULT_MERCHANT_ID))
    .orderBy(asc(providerConfigs.priority));

  return rows.map((row) => ({
    id: row.id,
    provider: row.provider as PaymentProviderName,
    displayName: row.displayName,
    enabled: row.enabled,
    testMode: row.testMode,
    priority: row.priority,
    secretConfigured: Boolean(row.secretRef),
    updatedAt: row.updatedAt
  }));
}

export async function listOrders(db: ReturnType<typeof createDb>, limit = 50): Promise<OrderSummary[]> {
  await ensureDefaultMerchant(db);
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.merchantId, DEFAULT_MERCHANT_ID))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return rows.map(orderRowToSummary);
}

export async function getOrder(
  db: ReturnType<typeof createDb>,
  routerpayOrderId: string
): Promise<OrderSummary | undefined> {
  await ensureDefaultMerchant(db);
  const row = await db.query.orders.findFirst({
    where: eq(orders.routerpayOrderId, routerpayOrderId)
  });

  return row ? orderRowToSummary(row) : undefined;
}

export async function listCallbackDeliveries(
  db: ReturnType<typeof createDb>,
  routerpayOrderId?: string
): Promise<CallbackDeliverySummary[]> {
  await ensureDefaultMerchant(db);
  const query = routerpayOrderId
    ? db.select().from(callbackDeliveries).where(eq(callbackDeliveries.routerpayOrderId, routerpayOrderId))
    : db.select().from(callbackDeliveries);
  const rows = await query.orderBy(desc(callbackDeliveries.createdAt)).limit(50);

  return rows.map((row) => ({
    id: row.id,
    routerpayOrderId: row.routerpayOrderId,
    callbackProtocol: row.callbackProtocol as CallbackDeliverySummary["callbackProtocol"],
    targetUrl: row.targetUrl,
    status: row.status as CallbackDeliverySummary["status"],
    attempts: row.attempts,
    lastStatusCode: row.lastStatusCode ?? undefined,
    lastResponseSummary: row.lastResponseSummary ?? undefined,
    lastError: row.lastError ?? undefined,
    nextRetryAt: row.nextRetryAt ?? undefined
  }));
}

function orderRowToSummary(row: typeof orders.$inferSelect): OrderSummary {
  return {
    routerpayOrderId: row.routerpayOrderId,
    merchantOrderId: row.merchantOrderId,
    provider: (row.provider ?? "afdian") as PaymentProviderName,
    inboundProtocol: row.inboundProtocol as OrderSummary["inboundProtocol"],
    status: row.status as RouterPayOrderStatus,
    amountMinor: row.amountMinor,
    currency: row.currency,
    createdAt: row.createdAt,
    paidAt: row.paidAt ?? undefined
  };
}
