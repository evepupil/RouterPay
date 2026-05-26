import { merchantApiCredentials } from "@/db/schema";
import {
  getProtocolSettings,
  listCallbackDeliveries,
  listOrders,
  listProviderConfigs
} from "@/features/admin/repository";
import { createTestDb } from "@/test/d1";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

describe("admin repository default data", () => {
  it("initializes default merchant data idempotently across concurrent admin queries", async () => {
    const testDb = await createTestDb();

    await expect(
      Promise.all([
        getProtocolSettings(testDb.db),
        listProviderConfigs(testDb.db),
        listOrders(testDb.db),
        listCallbackDeliveries(testDb.db)
      ])
    ).resolves.toBeDefined();

    const easypayCredentials = await testDb.db
      .select()
      .from(merchantApiCredentials)
      .where(eq(merchantApiCredentials.credentialType, "easypay_key"));

    expect(easypayCredentials).toHaveLength(1);
    expect(easypayCredentials[0].createdAt).not.toBe("CURRENT_TIMESTAMP");
  }, 15000);
});
