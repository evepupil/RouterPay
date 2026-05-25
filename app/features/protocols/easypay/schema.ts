import { z } from "zod";

export const easypayCreatePaymentSchema = z.object({
  pid: z.string().min(1),
  type: z.string().min(1),
  out_trade_no: z.string().min(1),
  notify_url: z.string().url().optional(),
  return_url: z.string().url().optional(),
  name: z.string().min(1),
  money: z.string().regex(/^\d+(\.\d{1,2})?$/),
  sitename: z.string().optional(),
  sign: z.string().min(1),
  sign_type: z.string().optional()
});
