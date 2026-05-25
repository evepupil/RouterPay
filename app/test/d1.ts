import { createDb } from "@/db/client";
import { Miniflare } from "miniflare";
import { readFile } from "node:fs/promises";

export async function createTestDb() {
  const mf = new Miniflare({
    script: "export default { fetch() { return new Response('ok') } }",
    modules: true,
    d1Databases: {
      DB: "routerpay-test"
    },
    d1Persist: false
  });
  const d1 = await mf.getD1Database("DB");

  await applyMigration(d1, "0001_initial.sql");
  await applyMigration(d1, "0002_callback_delivery_response_summary.sql");
  await applyMigration(d1, "0003_merchant_secret_and_provider_config.sql");
  await applyMigration(d1, "0004_afdian_mvp.sql");

  return {
    db: createDb(d1 as D1Database),
    async dispose() {
      await mf.dispose();
    }
  };
}

async function applyMigration(db: D1Database, filename: string) {
  const sql = await readFile(new URL(`../../migrations/${filename}`, import.meta.url), "utf8");
  const statements = sql
    .split(";")
    .map((statement: string) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}
