import { createDb } from "@/db/client";
import { callbackDeliveries, merchants, orders, protocolSettings, providerConfigs } from "@/db/schema";
import type {
  CallbackDeliverySummary,
  OrderSummary,
  PaymentProviderName,
  ProtocolSettings,
  ProviderConfigSummary,
  RouterPayOrderStatus
} from "@/shared/types";
import { asc, desc, eq } from "drizzle-orm";

export const DEFAULT_MERCHANT_ID = "m_default";

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
    status: row.status as CallbackDeliverySummary["status"],
    attempts: row.attempts,
    lastStatusCode: row.lastStatusCode ?? undefined,
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
