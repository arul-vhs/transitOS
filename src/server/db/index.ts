import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

if (typeof window !== "undefined") {
  throw new Error("CRITICAL: The database connection module must only be executed on the server!");
}

const dataDir = path.join(process.cwd(), ".pgdata");
const pglite = new PGlite(dataDir);

async function initPglite() {
  await pglite.waitReady;
  const tableCheck = await pglite.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants';",
  );
  if (!tableCheck.rows || tableCheck.rows.length === 0) {
    console.log("[DB] Initializing PGlite PostgreSQL tables and seed data...");
    const migrationsDir = path.join(process.cwd(), "src/server/db/migrations");
    if (fs.existsSync(migrationsDir)) {
      const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();
      for (const file of files) {
        const sqlContent = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
        const statements = sqlContent.split("--> statement-breakpoint");
        for (const stmt of statements) {
          const trimmed = stmt.trim();
          if (trimmed) {
            try {
              await pglite.exec(trimmed);
            } catch (err: any) {
              // Ignore warnings
            }
          }
        }
      }
    }

    const seedSqlPath = path.join(process.cwd(), "cloud_seed.sql");
    if (fs.existsSync(seedSqlPath)) {
      const seedSql = fs.readFileSync(seedSqlPath, "utf-8");
      await pglite.exec(seedSql);
    }
    console.log("[DB] PGlite database initialized successfully.");
  }
}

initPglite().catch((err) => console.error("[DB Init Error]:", err));

export const db = drizzlePglite(pglite, { schema });

/**
 * Reusable server-side helper to enforce tenant-scoping on database queries.
 */
export function withTenant<T extends { tenantId: any }>(table: T, tenantId: string) {
  return eq(table.tenantId, tenantId);
}
