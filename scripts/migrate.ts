import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../src/server/db";

// Load environment variables in Node runtime if not already loaded
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore error if .env file does not exist
  }
}

async function runMigrations() {
  const targetUrl =
    process.env.DATABASE_URL || "postgresql://postgres:1234@localhost:5432/postgres";
  const maskedUrl = targetUrl.replace(/:[^:@]+@/, ":****@");

  console.log("----------------------------------------");
  console.log(" TransitOS Database Migration Runner");
  console.log("----------------------------------------");
  console.log(`Target: ${maskedUrl}`);

  try {
    // Test database connection first
    console.log("[DB] Testing connection to PostgreSQL...");
    const client = await pool.connect();
    const result = await client.query("SELECT current_database(), version();");
    const currentDb = result.rows[0]?.current_database || "unknown";
    console.log(`[DB] Connected successfully to database: ${currentDb}`);
    client.release();

    // Execute migrations
    console.log("[DB] Applying pending migrations from src/server/db/migrations...");
    await migrate(db, { migrationsFolder: "./src/server/db/migrations" });
    console.log("[DB] All migrations applied successfully!");
  } catch (error: any) {
    console.error("\n[DB Error] Migration failed:");
    console.error(`Reason: ${error.message || error.code || String(error)}`);
    console.error("\nTroubleshooting tips:");
    console.error("1. Make sure your PostgreSQL server is running.");
    console.error("   If using Docker, run: docker compose up -d");
    console.error("2. Verify your DATABASE_URL in the .env file.");
    console.error("   Default: postgresql://postgres:1234@localhost:5432/postgres");
    console.error("3. If using local pgAdmin or native PostgreSQL, ensure port 5432 is open and the database exists.");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error("Unexpected error in migration script:", err);
  process.exit(1);
});
