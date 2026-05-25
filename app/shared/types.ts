export type InboundProtocol = "routerpay" | "easypay";

export type CallbackProtocol = "routerpay_webhook" | "easypay_notify";

export type PaymentProviderName = "afdian" | "stripe" | "alipay" | "wechat" | "paddle";

export type RouterPayOrderStatus =
  | "created"
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "refunded"
  | "partially_refunded"
  | "closed";

export type ProtocolSettings = {
  routerpayApiEnabled: boolean;
  easypayApiEnabled: boolean;
  routerpayWebhookEnabled: boolean;
  easypayNotifyEnabled: boolean;
};

export type ProviderConfigSummary = {
  id: string;
  provider: PaymentProviderName;
  displayName: string;
  enabled: boolean;
  testMode: boolean;
  priority: number;
  secretConfigured: boolean;
  updatedAt: string;
};

export type MerchantCredential = {
  merchantId: string;
  credentialType: "routerpay_api_key" | "easypay_key";
  publicKey: string;
  secretHash: string;
};

export type MerchantSecuritySettings = {
  merchantId: string;
  name: string;
  webhookUrl?: string;
  webhookSecretConfigured: boolean;
  routerpayApiKeyConfigured: boolean;
  easypayPid: string;
  easypayKeyConfigured: boolean;
  updatedAt: string;
};

export type MerchantSecurityUpdateResult = {
  settings: MerchantSecuritySettings;
  webhookSecret?: string;
};

export type OrderSummary = {
  routerpayOrderId: string;
  merchantOrderId: string;
  provider: PaymentProviderName;
  inboundProtocol: InboundProtocol;
  status: RouterPayOrderStatus;
  amountMinor: number;
  currency: string;
  createdAt: string;
  paidAt?: string;
};

export type CallbackDeliverySummary = {
  id: string;
  routerpayOrderId: string;
  callbackProtocol: CallbackProtocol;
  targetUrl: string;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  lastStatusCode?: number;
  lastResponseSummary?: string;
  lastError?: string;
  nextRetryAt?: string;
};
