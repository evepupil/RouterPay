import { getPaymentProvider } from "@/features/providers/registry";
import type { PaymentProviderName } from "@/shared/types";
import type { CreatePaymentInput, CreatePaymentResult } from "@/features/protocols/types";
import type { createDb } from "@/db/client";
import { createOrReuseOrder } from "./repository";

export async function createPayment(db: ReturnType<typeof createDb>, input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const order = await createOrReuseOrder(db, input);
  const provider = getPaymentProvider(((order.provider ?? input.provider) ?? "afdian") as PaymentProviderName);

  if (!provider) {
    throw new Error("Payment provider is not configured");
  }

  const result = await provider.createPayment({
    ...input,
    provider: order.provider as CreatePaymentInput["provider"],
    merchantOrderId: order.merchantOrderId
  });

  return {
    ...result,
    routerpayOrderId: order.routerpayOrderId
  };
}
