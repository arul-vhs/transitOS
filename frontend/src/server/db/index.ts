import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

if (typeof window !== "undefined") {
  throw new Error("CRITICAL: The database connection module must only be executed on the server!");
}

const connectionString = process.env.DATABASE_URL;

// Fallback to local postgres for development/seeding if env is empty
const dbUrl = connectionString || "postgres://postgres:1234@localhost:5432/transitos";

// Create pg client pool with timeout so edge environments do not block if db is absent
let pool: pg.Pool;
try {
  pool = new pg.Pool({
    connectionString: dbUrl,
    connectionTimeoutMillis: 2000,
  });
} catch {
  pool = new pg.Pool({ connectionTimeoutMillis: 2000 });
}

export const db = drizzle(pool, { schema });

/**
 * Reusable server-side helper to enforce tenant-scoping on database queries.
 * Ensures we cannot accidentally query records across tenants.
 * 
 * Usage example:
 *   await db.select().from(buses).where(withTenant(buses, tenantId));
 */
export function withTenant<T extends { tenantId: any }>(table: T, tenantId: string) {
  return eq(table.tenantId, tenantId);
}
