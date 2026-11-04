import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

if (typeof window !== "undefined") {
  throw new Error(
    "CRITICAL: The database connection module must only be executed on the server!",
  );
}

// Load environment variables in Node runtime if not already loaded
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore error if .env file does not exist
  }
}

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:1234@localhost:5432/postgres";

declare global {
  // eslint-disable-next-line no-var
  var __transitOS_pg_pool: pg.Pool | undefined;
  // eslint-disable-next-line no-var
  var __transitOS_drizzle_db: NodePgDatabase<typeof schema> | undefined;
}

// Reuse connection pool during development hot-reloads to prevent connection exhaustion
const pool =
  globalThis.__transitOS_pg_pool ??
  new pg.Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__transitOS_pg_pool = pool;
}

pool.on("error", (err) => {
  console.error(
    "[PostgreSQL Pool Error]: Unexpected client error",
    err.message,
  );
});

export const db: NodePgDatabase<typeof schema> =
  globalThis.__transitOS_drizzle_db ?? drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  globalThis.__transitOS_drizzle_db = db;
}

export { pool };

/**
 * Reusable server-side helper to enforce tenant-scoping on database queries.
 */
export function withTenant<T extends { tenantId: any }>(
  table: T,
  tenantId: string,
) {
  return eq(table.tenantId, tenantId);
}

/**
 * Normalizes input to a valid UUID string or null to prevent PostgreSQL invalid syntax errors.
 */
export function cleanUuid(val: unknown): string | null {
  if (!val || typeof val !== "string") return null;
  const trimmed = val.trim();
  if (
    !trimmed ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "none" ||
    trimmed === ""
  ) {
    return null;
  }
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trimmed) ? trimmed : null;
}

/**
 * Normalizes input to a non-empty string or null.
 */
export function cleanString(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  return str.length > 0 ? str : null;
}
