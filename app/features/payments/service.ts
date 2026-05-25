import { getPaymentProvider } from "@/features/providers/registry";
import type { CreatePaymentInput, CreatePaymentResult } from "@/features/protocols/types";

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const provider = getPaymentProvider(input.provider ?? "afdian");

  if (!provider) {
    throw new Error("Payment provider is not configured");
  }

  return provider.createPayment(input);
}
