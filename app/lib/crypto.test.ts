import { md5Hex, sha256Hex, timingSafeEqual } from "./crypto";
import { describe, expect, it } from "vitest";

describe("crypto helpers", () => {
  it("hashes api keys with sha256 hex", async () => {
    expect(await sha256Hex("rp_dev_key")).toHaveLength(64);
  });

  it("hashes md5 without relying on Web Crypto MD5 support", async () => {
    expect(await md5Hex("abc")).toBe("900150983cd24fb0d6963f7d28e17f72");
  });

  it("compares equal strings without early length success", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});
