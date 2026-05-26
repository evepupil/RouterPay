import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const adminUiFiles = [
  new URL("./components.tsx", import.meta.url),
  new URL("../../routes/admin/provider-configs.tsx", import.meta.url)
];

describe("admin UI copy", () => {
  it("does not contain placeholder question marks or mojibake text", async () => {
    const source = (await Promise.all(adminUiFiles.map((file) => readFile(file, "utf8")))).join("\n");

    expect(source).not.toContain("???");
    expect(source).not.toMatch(/[鏀娓鐘鍚鏈绛鎼璁鍥缁榛鐖涓閰灏褰浼瀵妯鐢娴姝鏆鍒鏌閲鎿琛]/);
  });
});
