import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);

function buildPoolerCandidates(databaseUrl) {
  const match = databaseUrl.match(/^postgresql:\/\/postgres(?::([^@]+))?@db\.([a-z0-9-]+)\.supabase\.co:5432\/postgres$/i);
  if (!match) return [databaseUrl];
  const password = encodeURIComponent(match[1] || '');
  const ref = match[2];
  return [
    databaseUrl,
    `postgresql://postgres.${ref}:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${password}@aws-1-eu-central-1.pooler.supabase.com:5432/postgres`,
  ];
}

async function connectPg() {
  for (const url of buildPoolerCandidates(env.STAGING_DATABASE_URL)) {
    const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      return client;
    } catch {
      try { await client.end(); } catch { /* ignore */ }
    }
  }
  throw new Error('Could not connect');
}

const sql = fs.readFileSync(path.join(root, 'sql', '2026-05-31-manual-payment-providers.sql'), 'utf8');
const client = await connectPg();
await client.query(sql);
await client.query(`notify pgrst, 'reload schema';`);
console.log('manual payment provider migration applied');
await client.end();
