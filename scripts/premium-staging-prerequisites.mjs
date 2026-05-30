#!/usr/bin/env node
/**
 * Staging-only prerequisite migrations for premium monetization verification.
 * NOT for production. Targets pgrrdkuhdoiuqmzafilh only.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const STAGING_REF = 'pgrrdkuhdoiuqmzafilh';

const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    })
);

function buildPoolerCandidates(databaseUrl) {
  const match = databaseUrl.match(/^postgresql:\/\/postgres(?::([^@]+))?@db\.([a-z0-9-]+)\.supabase\.co:5432\/postgres$/i);
  if (!match) return [databaseUrl];
  const password = encodeURIComponent(match[1] || '');
  const ref = match[2];
  return [
    databaseUrl,
    `postgresql://postgres.${ref}:${password}@aws-1-eu-central-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`,
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
  throw new Error('Could not connect to staging Postgres');
}

async function runSqlFile(client, relativePath) {
  const sql = fs.readFileSync(path.join(root, relativePath), 'utf8');
  console.log(`Applying ${relativePath}...`);
  await client.query(sql);
  console.log(`Done ${relativePath}`);
}

async function main() {
  if (!String(env.STAGING_DATABASE_URL || '').includes(STAGING_REF)) {
    throw new Error('Refusing: not staging ref');
  }

  const client = await connectPg();
  try {
    await runSqlFile(client, 'sql/2026-05-28-account-plans-and-listing-rights.sql');
    await runSqlFile(client, 'sql/stripe-payment-hardening.sql');
    await runSqlFile(client, 'sql/admin-premium-v10.sql');

    await client.query(`
      alter table public.listings add column if not exists premium_source text;
      alter table public.payment_orders add column if not exists plan text;
      alter table public.payment_orders add column if not exists product_type text default 'featured_listing';
      alter table public.payment_orders add column if not exists stripe_payment_intent_id text;
      notify pgrst, 'reload schema';
    `);
    console.log('Staging prerequisites applied.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
