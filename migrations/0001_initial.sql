CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  webhook_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchant_api_credentials (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id),
  credential_type TEXT NOT NULL,
  public_key TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (credential_type, public_key)
);

CREATE TABLE IF NOT EXISTS protocol_settings (
  merchant_id TEXT PRIMARY KEY REFERENCES merchants(id),
  routerpay_api_enabled INTEGER NOT NULL DEFAULT 1,
  easypay_api_enabled INTEGER NOT NULL DEFAULT 1,
  routerpay_webhook_enabled INTEGER NOT NULL DEFAULT 1,
  easypay_notify_enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_configs (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id),
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  test_mode INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 100,
  secret_ref TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (merchant_id, provider)
);

CREATE TABLE IF NOT EXISTS payment_routes (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id),
  payment_method TEXT NOT NULL,
  provider_config_id TEXT NOT NULL REFERENCES provider_configs(id),
  enabled INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  routerpay_order_id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id),
  merchant_order_id TEXT NOT NULL,
  inbound_protocol TEXT NOT NULL,
  provider TEXT,
  provider_trade_no TEXT,
  status TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  order_name TEXT NOT NULL,
  notify_url TEXT,
  return_url TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (merchant_id, inbound_protocol, merchant_order_id)
);

CREATE TABLE IF NOT EXISTS provider_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_key TEXT NOT NULL,
  provider_trade_no TEXT,
  signature_valid INTEGER NOT NULL,
  raw_payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (provider, event_key)
);

CREATE TABLE IF NOT EXISTS payment_events (
  event_id TEXT PRIMARY KEY,
  routerpay_order_id TEXT NOT NULL REFERENCES orders(routerpay_order_id),
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS callback_deliveries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES payment_events(event_id),
  routerpay_order_id TEXT NOT NULL REFERENCES orders(routerpay_order_id),
  callback_protocol TEXT NOT NULL,
  target_url TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_status_code INTEGER,
  last_error TEXT,
  next_retry_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compat_requests (
  id TEXT PRIMARY KEY,
  merchant_id TEXT,
  inbound_protocol TEXT NOT NULL,
  request_path TEXT NOT NULL,
  request_summary_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_merchant_status ON orders (merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_provider_trade_no ON orders (provider, provider_trade_no);
CREATE INDEX IF NOT EXISTS idx_callback_deliveries_order ON callback_deliveries (routerpay_order_id);
