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
  status: "pending" | "delivered" | "failed";
  attempts: number;
  lastStatusCode?: number;
  lastError?: string;
  nextRetryAt?: string;
};
