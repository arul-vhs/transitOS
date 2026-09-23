import fs from 'fs';
import path from 'path';

function generateSql() {
  const jsonPath = path.join(process.cwd(), 'src', 'server', 'db', 'extracted-data.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const lines: string[] = [
    '-- TransitOS Cloud Database Seed SQL',
    '-- Replicates complete Salem Transport Corporation dataset',
    'BEGIN;',
    '',
  ];

  for (const [table, rows] of Object.entries(data)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    lines.push(`-- Table: ${table} (${rows.length} rows)`);
    for (const row of rows) {
      const cols = Object.keys(row).map(c => `"${c}"`).join(', ');
      const vals = Object.values(row).map(v => {
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number' || typeof v === 'boolean') return `${v}`;
        if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
        return `'${String(v).replace(/'/g, "''")}'`;
      }).join(', ');

      lines.push(`INSERT INTO "${table}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;`);
    }
    lines.push('');
  }

  lines.push('COMMIT;');
  const sqlPath = path.join(process.cwd(), 'cloud_seed.sql');
  fs.writeFileSync(sqlPath, lines.join('\n'), 'utf-8');
  console.log(`Generated cloud_seed.sql (${lines.length} lines)`);
}

generateSql();
