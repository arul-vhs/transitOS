import { Client } from "pg";
import fs from "fs";
import path from "path";

async function backup() {
  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:1234@localhost:5432/transit",
  });
  await client.connect();

  const tablesRes = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  );

  const dump = {
    timestamp: new Date().toISOString(),
    tables: {},
  };

  for (const row of tablesRes.rows) {
    const tableName = row.table_name;
    const res = await client.query(`SELECT * FROM "${tableName}"`);
    dump.tables[tableName] = res.rows;
    console.log(`Backed up ${tableName}: ${res.rows.length} rows`);
  }

  const filename = path.join(
    backupDir,
    `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  );
  fs.writeFileSync(filename, JSON.stringify(dump, null, 2), "utf8");
  console.log(`Database backup saved cleanly to: ${filename}`);

  await client.end();
}

backup().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
