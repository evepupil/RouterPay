import type { CallbackProtocol, InboundProtocol, PaymentProviderName } from "@/shared/types";

export type CreatePaymentInput = {
  merchantId: string;
  merchantOrderId: string;
  inboundProtocol: InboundProtocol;
  provider?: PaymentProviderName;
  amountMinor: number;
  currency: string;
  orderName: string;
  notifyUrl?: string;
  returnUrl?: string;
  metadata: Record<string, string>;
};

export type CreatePaymentResult = {
  routerpayOrderId: string;
  paymentUrl: string;
};

export type CallbackPayload = {
  protocol: CallbackProtocol;
  headers: Record<string, string>;
  body: string;
};

export type HttpRequestInput = {
  method: string;
  url: string;
  headers: Headers;
  body: unknown;
};

export type MerchantIdentity = {
  merchantId: string;
};

export interface InboundProtocolAdapter {
  name: InboundProtocol;
  parseCreatePayment(input: HttpRequestInput): Promise<CreatePaymentInput>;
  formatCreatePaymentResult(result: CreatePaymentResult): Response;
  formatCallback(event: unknown): Promise<CallbackPayload>;
  verifyMerchantRequest?(input: HttpRequestInput): Promise<MerchantIdentity>;
}
