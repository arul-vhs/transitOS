import pg from 'pg';
import fs from 'fs';
import path from 'path';

async function syncToCloud() {
  const targetUrl = process.env.CLOUD_DATABASE_URL || process.env.DATABASE_URL;

  console.log('--- TransitOS Cloud Database Sync ---');
  if (!targetUrl || targetUrl.includes('localhost')) {
    console.log('Notice: CLOUD_DATABASE_URL is not set to a remote host.');
    console.log('To replicate data to a remote cloud DB (Neon/Supabase/Aiven), run:');
    console.log('  $env:CLOUD_DATABASE_URL="postgres://user:password@ep-xyz.neon.tech/transitos?sslmode=require"');
    console.log('  npm run db:cloud:sync');
    console.log('');
    console.log('The offline SQL export file is ready at: cloud_seed.sql');
    console.log('You can also copy-paste cloud_seed.sql directly into your Neon or Supabase SQL Editor.');
    return;
  }

  console.log(`Connecting to Cloud Database: ${targetUrl.replace(/:[^:@]+@/, ':****@')}...`);
  const pool = new pg.Pool({ connectionString: targetUrl, connectionTimeoutMillis: 10000 });

  try {
    const sqlPath = path.join(process.cwd(), 'cloud_seed.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Applying cloud seed SQL...');
    await pool.query(sqlContent);
    console.log('✅ Successfully replicated complete local database data to Cloud Database!');
  } catch (err: any) {
    console.error('Error applying cloud seed:', err.message);
  } finally {
    await pool.end();
  }
}

syncToCloud().catch(console.error);
