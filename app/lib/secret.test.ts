import { decryptSecret, encryptSecret, hashSecret } from "./secret";
import { describe, expect, it } from "vitest";

describe("secret helpers", () => {
  it("encrypts decryptable secrets and hashes without exposing plaintext", async () => {
    const encrypted = await encryptSecret("secret-value-123", "test-key");
    const hash = await hashSecret("secret-value-123");

    expect(encrypted).toMatch(/^v1\./);
    expect(encrypted).not.toContain("secret-value-123");
    expect(hash).toHaveLength(64);
    expect(await decryptSecret(encrypted, "test-key")).toBe("secret-value-123");
  });
});
