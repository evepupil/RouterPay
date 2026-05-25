import { getCredentialByPublicKey } from "@/features/merchants/repository";
import { md5Hex, sha256Hex, timingSafeEqual } from "@/lib/crypto";
import type { createDb } from "@/db/client";

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code = "unauthorized"
  ) {
    super(message);
  }
}

export async function verifyRouterPayBearer(db: ReturnType<typeof createDb>, authorization: string | null) {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    throw new AuthError("Missing RouterPay bearer token");
  }

  const tokenHash = await sha256Hex(token);
  const credential = await getCredentialByPublicKey(db, "routerpay_api_key", tokenHash);

  if (!credential || !timingSafeEqual(credential.secretHash, tokenHash)) {
    throw new AuthError("Invalid RouterPay bearer token");
  }

  return { merchantId: credential.merchantId };
}

export async function verifyEasyPaySign(db: ReturnType<typeof createDb>, params: Record<string, string>) {
  const pid = params.pid;
  const sign = params.sign;

  if (!pid || !sign) {
    throw new AuthError("Missing EasyPay pid or sign");
  }

  const credential = await getCredentialByPublicKey(db, "easypay_key", pid);

  if (!credential) {
    throw new AuthError("Unknown EasyPay pid");
  }

  const expected = await createEasyPaySign(params, credential.secretHash);

  if (!timingSafeEqual(expected.toLowerCase(), sign.toLowerCase())) {
    throw new AuthError("Invalid EasyPay sign");
  }

  return { merchantId: credential.merchantId };
}

export async function createEasyPaySign(params: Record<string, string>, key: string): Promise<string> {
  const base = Object.entries(params)
    .filter(([name, value]) => name !== "sign" && name !== "sign_type" && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");

  return md5Hex(`${base}${key}`);
}
