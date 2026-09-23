import pg from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:1234@localhost:5432/transitos',
  connectionTimeoutMillis: 5000,
});

async function main() {
  console.log('Connecting to database...');
  const tables = [
    'tenants',
    'users',
    'buses',
    'crew',
    'routes',
    'stops',
    'trips',
    'duties',
    'duty_trips',
    'duty_crew_segments',
    'incidents',
    'schedules',
  ];

  const data: Record<string, any[]> = {};
  for (const t of tables) {
    try {
      const res = await pool.query(`SELECT * FROM ${t}`);
      data[t] = res.rows;
      console.log(`Extracted table ${t}: ${res.rows.length} rows`);
    } catch (e: any) {
      console.warn(`Could not read table ${t}: ${e.message}`);
      data[t] = [];
    }
  }

  const outPath = path.join(process.cwd(), 'src', 'server', 'db', 'extracted-data.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved extracted data to ${outPath}`);

  await pool.end();
}

main().catch((err) => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
