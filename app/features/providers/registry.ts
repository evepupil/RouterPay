import type { PaymentProviderName } from "@/shared/types";
import type { PaymentProvider } from "./types";
import { afdianProvider } from "./afdian/adapter";

const providers = new Map<PaymentProviderName, PaymentProvider>([["afdian", afdianProvider]]);

export function getPaymentProvider(name: PaymentProviderName): PaymentProvider | undefined {
  return providers.get(name);
}
