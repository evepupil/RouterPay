import type { PaymentProviderName, RouterPayOrderStatus } from "@/shared/types";
import type { CreatePaymentInput, CreatePaymentResult } from "@/features/protocols/types";

export type VerifyWebhookInput = {
  headers: Headers;
  rawBody: string;
};

export type VerifiedProviderEvent = {
  provider: PaymentProviderName;
  eventKey: string;
  providerTradeNo: string;
  paymentCode?: string;
  raw: unknown;
};

export type NormalizedPaymentEvent = {
  provider: PaymentProviderName;
  providerTradeNo: string;
  status: RouterPayOrderStatus;
  amountMinor: number;
  currency: string;
  paidAt?: string;
};

export type ProviderCreatePaymentResult = CreatePaymentResult & {
  providerTradeNo?: string;
};

export type ProviderRuntimeConfig = {
  providerConfig?: Record<string, unknown>;
  paymentCode?: string;
};

export interface PaymentProvider {
  name: PaymentProviderName;
  createPayment(input: CreatePaymentInput & ProviderRuntimeConfig): Promise<ProviderCreatePaymentResult>;
  verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedProviderEvent>;
  normalizeEvent(event: VerifiedProviderEvent): Promise<NormalizedPaymentEvent>;
}
