import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const merchants = sqliteTable("merchants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  webhookUrl: text("webhook_url"),
  webhookSecretHash: text("webhook_secret_hash"),
  webhookSecretEncrypted: text("webhook_secret_encrypted"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP")
});

export const merchantApiCredentials = sqliteTable(
  "merchant_api_credentials",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id),
    credentialType: text("credential_type").notNull(),
    publicKey: text("public_key").notNull(),
    secretHash: text("secret_hash").notNull(),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP")
  },
  (table) => ({
    credentialPublicKeyIdx: uniqueIndex("merchant_api_credentials_type_public_key_unique").on(
      table.credentialType,
      table.publicKey
    )
  })
);

export const protocolSettings = sqliteTable("protocol_settings", {
  merchantId: text("merchant_id")
    .primaryKey()
    .references(() => merchants.id),
  routerpayApiEnabled: integer("routerpay_api_enabled", { mode: "boolean" }).notNull().default(true),
  easypayApiEnabled: integer("easypay_api_enabled", { mode: "boolean" }).notNull().default(true),
  routerpayWebhookEnabled: integer("routerpay_webhook_enabled", { mode: "boolean" }).notNull().default(true),
  easypayNotifyEnabled: integer("easypay_notify_enabled", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP")
});

export const providerConfigs = sqliteTable(
  "provider_configs",
  {
    id: text("id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id),
    provider: text("provider").notNull(),
    displayName: text("display_name").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
    testMode: integer("test_mode", { mode: "boolean" }).notNull().default(true),
    priority: integer("priority").notNull().default(100),
    secretRef: text("secret_ref"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP")
  },
  (table) => ({
    merchantProviderIdx: uniqueIndex("provider_configs_merchant_provider_unique").on(table.merchantId, table.provider)
  })
);

export const paymentRoutes = sqliteTable("payment_routes", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id),
  paymentMethod: text("payment_method").notNull(),
  providerConfigId: text("provider_config_id")
    .notNull()
    .references(() => providerConfigs.id),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  priority: integer("priority").notNull().default(100),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP")
});

export const orders = sqliteTable(
  "orders",
  {
    routerpayOrderId: text("routerpay_order_id").primaryKey(),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id),
    merchantOrderId: text("merchant_order_id").notNull(),
    inboundProtocol: text("inbound_protocol").notNull(),
    provider: text("provider"),
    providerTradeNo: text("provider_trade_no"),
    status: text("status").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
    orderName: text("order_name").notNull(),
    notifyUrl: text("notify_url"),
    returnUrl: text("return_url"),
    metadataJson: text("metadata_json").notNull().default("{}"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    paidAt: text("paid_at"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP")
  },
  (table) => ({
    merchantProtocolOrderIdx: uniqueIndex("orders_merchant_protocol_order_unique").on(
      table.merchantId,
      table.inboundProtocol,
      table.merchantOrderId
    )
  })
);

export const providerEvents = sqliteTable(
  "provider_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    eventKey: text("event_key").notNull(),
    providerTradeNo: text("provider_trade_no"),
    signatureValid: integer("signature_valid", { mode: "boolean" }).notNull(),
    rawPayload: text("raw_payload").notNull(),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP")
  },
  (table) => ({
    providerEventKeyIdx: uniqueIndex("provider_events_provider_event_key_unique").on(table.provider, table.eventKey)
  })
);

export const paymentEvents = sqliteTable("payment_events", {
  eventId: text("event_id").primaryKey(),
  routerpayOrderId: text("routerpay_order_id")
    .notNull()
    .references(() => orders.routerpayOrderId),
  eventType: text("event_type").notNull(),
  status: text("status").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  occurredAt: text("occurred_at").notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP")
});

export const callbackDeliveries = sqliteTable("callback_deliveries", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => paymentEvents.eventId),
  routerpayOrderId: text("routerpay_order_id")
    .notNull()
    .references(() => orders.routerpayOrderId),
  callbackProtocol: text("callback_protocol").notNull(),
  targetUrl: text("target_url").notNull(),
  status: text("status").notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastStatusCode: integer("last_status_code"),
  lastResponseSummary: text("last_response_summary"),
  lastError: text("last_error"),
  nextRetryAt: text("next_retry_at"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP")
});

export const compatRequests = sqliteTable("compat_requests", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id"),
  inboundProtocol: text("inbound_protocol").notNull(),
  requestPath: text("request_path").notNull(),
  requestSummaryJson: text("request_summary_json").notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP")
});
