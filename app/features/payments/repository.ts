import { createDb } from "@/db/client";
import { orders } from "@/db/schema";
import { DEFAULT_MERCHANT_ID, ensureDefaultMerchant } from "@/features/admin/repository";
import type { CreatePaymentInput } from "@/features/protocols/types";
import { and, eq } from "drizzle-orm";

export async function createOrReuseOrder(db: ReturnType<typeof createDb>, input: CreatePaymentInput) {
  await ensureDefaultMerchant(db);

  const merchantId = input.merchantId || DEFAULT_MERCHANT_ID;
  const existing = await db.query.orders.findFirst({
    where: and(
      eq(orders.merchantId, merchantId),
      eq(orders.inboundProtocol, input.inboundProtocol),
      eq(orders.merchantOrderId, input.merchantOrderId)
    )
  });

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const routerpayOrderId = `rp_${crypto.randomUUID().replaceAll("-", "")}`;
  const value = {
    routerpayOrderId,
    merchantId,
    merchantOrderId: input.merchantOrderId,
    inboundProtocol: input.inboundProtocol,
    provider: input.provider ?? "afdian",
    status: "created",
    amountMinor: input.amountMinor,
    currency: input.currency,
    orderName: input.orderName,
    notifyUrl: input.notifyUrl,
    returnUrl: input.returnUrl,
    metadataJson: JSON.stringify(input.metadata),
    createdAt: now,
    updatedAt: now
  };

  await db.insert(orders).values(value);

  return value;
}
