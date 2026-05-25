import { z } from "zod";

export const merchantSecurityUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  webhookUrl: z.string().url().or(z.literal("")).optional(),
  webhookSecret: z.string().min(12).max(200).optional().or(z.literal("")),
  easypayPid: z.string().min(1).max(80).optional(),
  easypayKey: z.string().min(8).max(200).optional().or(z.literal(""))
});

export const providerConfigUpsertSchema = z.object({
  provider: z.enum(["afdian", "stripe", "alipay", "wechat", "paddle"]),
  displayName: z.string().min(1).max(80),
  enabled: z.boolean(),
  testMode: z.boolean(),
  priority: z.number().int().min(0).max(9999),
  secretRef: z.string().max(200).optional().or(z.literal(""))
});
