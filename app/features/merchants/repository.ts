import { createDb } from "@/db/client";
import { merchantApiCredentials } from "@/db/schema";
import type { MerchantCredential } from "@/shared/types";
import { and, eq } from "drizzle-orm";

export async function getCredentialByPublicKey(
  db: ReturnType<typeof createDb>,
  credentialType: MerchantCredential["credentialType"],
  publicKey: string
): Promise<MerchantCredential | undefined> {
  const row = await db.query.merchantApiCredentials.findFirst({
    where: and(
      eq(merchantApiCredentials.credentialType, credentialType),
      eq(merchantApiCredentials.publicKey, publicKey)
    )
  });

  return row
    ? {
        merchantId: row.merchantId,
        credentialType: row.credentialType as MerchantCredential["credentialType"],
        publicKey: row.publicKey,
        secretHash: row.secretHash
      }
    : undefined;
}
