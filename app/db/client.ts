import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export function getDb(c: { env?: { DB?: D1Database } }) {
  if (!c.env?.DB) {
    throw new Error("D1 binding DB is not available");
  }

  return createDb(c.env.DB);
}

export type AppDb = ReturnType<typeof createDb>;
