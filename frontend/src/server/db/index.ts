import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

if (typeof window !== "undefined") {
  throw new Error("CRITICAL: The database connection module must only be executed on the server!");
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL environment variable is required in production!");
}

// Fallback to local postgres for development/seeding if env is empty
const dbUrl = connectionString || "postgres://postgres:1234@localhost:5432/transitos";

// Create pg client pool
const pool = new pg.Pool({
  connectionString: dbUrl,
});

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
