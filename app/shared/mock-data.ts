import type {
  CallbackDeliverySummary,
  OrderSummary,
  ProtocolSettings,
  ProviderConfigSummary
} from "./types";

export const protocolSettings: ProtocolSettings = {
  routerpayApiEnabled: true,
  easypayApiEnabled: true,
  routerpayWebhookEnabled: true,
  easypayNotifyEnabled: true
};

export const providerConfigs: ProviderConfigSummary[] = [
  {
    id: "pcfg_afdian",
    provider: "afdian",
    displayName: "爱发电",
    enabled: true,
    testMode: false,
    priority: 10,
    secretConfigured: true,
    updatedAt: "2026-05-25T08:10:00Z"
  },
  {
    id: "pcfg_stripe",
    provider: "stripe",
    displayName: "Stripe",
    enabled: false,
    testMode: true,
    priority: 30,
    secretConfigured: false,
    updatedAt: "2026-05-25T08:10:00Z"
  }
];

export const orders: OrderSummary[] = [
  {
    routerpayOrderId: "rp_order_1001",
    merchantOrderId: "biz_ai_20260525001",
    provider: "afdian",
    inboundProtocol: "routerpay",
    status: "paid",
    amountMinor: 1990,
    currency: "CNY",
    createdAt: "2026-05-25T07:44:13Z",
    paidAt: "2026-05-25T07:45:02Z"
  },
  {
    routerpayOrderId: "rp_order_1002",
    merchantOrderId: "E20260525002",
    provider: "afdian",
    inboundProtocol: "easypay",
    status: "pending",
    amountMinor: 990,
    currency: "CNY",
    createdAt: "2026-05-25T08:04:18Z"
  }
];

export const callbackDeliveries: CallbackDeliverySummary[] = [
  {
    id: "cdlv_1001",
    routerpayOrderId: "rp_order_1001",
    callbackProtocol: "routerpay_webhook",
    status: "delivered",
    attempts: 1,
    lastStatusCode: 200
  },
  {
    id: "cdlv_1002",
    routerpayOrderId: "rp_order_1002",
    callbackProtocol: "easypay_notify",
    status: "pending",
    attempts: 0,
    nextRetryAt: "2026-05-25T08:09:18Z"
  }
];
