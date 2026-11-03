import { defineConfig } from "drizzle-kit";

// Load environment variables in Node runtime if not already loaded
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore error if .env file does not exist
  }
}

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:1234@localhost:5432/postgres";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
