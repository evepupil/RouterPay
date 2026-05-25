ALTER TABLE provider_configs ADD COLUMN config_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE orders ADD COLUMN payment_code TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_payment_code ON orders (provider, payment_code);
