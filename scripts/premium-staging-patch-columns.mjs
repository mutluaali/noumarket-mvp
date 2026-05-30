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

const client = await connectPg();
await client.query(`
  alter table public.payment_orders add column if not exists plan text;
  alter table public.payment_orders add column if not exists product_type text default 'featured_listing';
  alter table public.payment_orders add column if not exists provider_session_id text;
  alter table public.payment_orders add column if not exists provider_payment_id text;
  alter table public.payment_orders add column if not exists stripe_session_id text;
  alter table public.payment_orders add column if not exists paid_at timestamptz;
  alter table public.payment_orders add column if not exists metadata jsonb default '{}'::jsonb;
  alter table public.listings add column if not exists premium_source text;
  notify pgrst, 'reload schema';
`);
console.log('payment_orders columns patched on staging');
await client.end();
