import { sha256Hex } from "./crypto";

const DEV_ENCRYPTION_KEY = "routerpay_dev_secret_encryption_key";

export async function hashSecret(value: string): Promise<string> {
  return sha256Hex(value);
}

export async function encryptSecret(value: string, keyMaterial?: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importAesKey(keyMaterial);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));

  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

export async function decryptSecret(value: string, keyMaterial?: string): Promise<string> {
  const [version, ivText, encryptedText] = value.split(".");

  if (version !== "v1" || !ivText || !encryptedText) {
    throw new Error("Unsupported encrypted secret format");
  }

  const key = await importAesKey(keyMaterial);
  const ivBuffer = bytesToArrayBuffer(base64ToBytes(ivText));
  const encryptedBuffer = bytesToArrayBuffer(base64ToBytes(encryptedText));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer },
    key,
    encryptedBuffer
  );

  return new TextDecoder().decode(decrypted);
}

async function importAesKey(keyMaterial?: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(keyMaterial || DEV_ENCRYPTION_KEY)
  );

  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}
