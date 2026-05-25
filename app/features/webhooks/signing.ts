import { hmacSha256Hex } from "@/lib/crypto";

export async function createRouterPayWebhookHeaders(input: {
  body: string;
  secret: string;
  timestamp?: number;
}): Promise<Record<string, string>> {
  const timestamp = input.timestamp ?? Math.floor(Date.now() / 1000);
  const signature = await hmacSha256Hex(`${timestamp}.${input.body}`, input.secret);

  return {
    "content-type": "application/json",
    "routerpay-timestamp": String(timestamp),
    "routerpay-signature": `v1=${signature}`
  };
}
