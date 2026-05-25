UPDATE merchants
SET created_at = datetime('now'), updated_at = datetime('now')
WHERE created_at = 'CURRENT_TIMESTAMP' OR updated_at = 'CURRENT_TIMESTAMP';

UPDATE merchant_api_credentials
SET created_at = datetime('now'), updated_at = datetime('now')
WHERE created_at = 'CURRENT_TIMESTAMP' OR updated_at = 'CURRENT_TIMESTAMP';

UPDATE provider_configs
SET created_at = datetime('now'), updated_at = datetime('now')
WHERE created_at = 'CURRENT_TIMESTAMP' OR updated_at = 'CURRENT_TIMESTAMP';
