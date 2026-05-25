import { getPaymentProvider } from "@/features/providers/registry";
import type { PaymentProviderName } from "@/shared/types";
import type { CreatePaymentInput, CreatePaymentResult } from "@/features/protocols/types";
import type { createDb } from "@/db/client";
import { attachProviderTradeNo, createOrReuseOrder } from "./repository";
import { getProtocolSettings, listProviderConfigs } from "@/features/admin/repository";

export async function createPayment(db: ReturnType<typeof createDb>, input: CreatePaymentInput): Promise<CreatePaymentResult> {
  await assertPaymentAllowed(db, input);
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
  await attachProviderTradeNo(db, order.routerpayOrderId, result.providerTradeNo);

  return {
    routerpayOrderId: order.routerpayOrderId,
    paymentUrl: result.paymentUrl
  };
}

async function assertPaymentAllowed(db: ReturnType<typeof createDb>, input: CreatePaymentInput) {
  const settings = await getProtocolSettings(db);

  if (input.inboundProtocol === "routerpay" && !settings.routerpayApiEnabled) {
    throw new Error("RouterPay API is disabled");
  }

  if (input.inboundProtocol === "easypay" && !settings.easypayApiEnabled) {
    throw new Error("EasyPay compatible API is disabled");
  }

  const selectedProvider = input.provider ?? "afdian";
  const providers = await listProviderConfigs(db);
  const providerConfig = providers.find((provider) => provider.provider === selectedProvider);

  if (!providerConfig?.enabled) {
    throw new Error("Payment provider is disabled");
  }
}
