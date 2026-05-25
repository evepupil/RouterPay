import { z } from "zod";

export const routerpayCreatePaymentSchema = z.object({
  merchantId: z.string().min(1),
  merchantOrderId: z.string().min(1),
  provider: z.enum(["afdian", "stripe", "alipay", "wechat", "paddle"]).optional(),
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3).default("CNY"),
  orderName: z.string().min(1),
  notifyUrl: z.string().url().optional(),
  returnUrl: z.string().url().optional(),
  metadata: z.record(z.string()).optional()
});
