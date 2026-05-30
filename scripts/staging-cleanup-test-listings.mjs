#!/usr/bin/env node
/**
 * Staging/dev only: preview and optionally hide obvious test listings.
 * Default: preview. Pass --apply to set status=passive.
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const apply = process.argv.includes('--apply');

const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const ref = env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown';
if (/prod|production/i.test(env.STAGING_DATABASE_URL || '') && !env.ALLOW_PRODUCTION_DATABASE) {
  console.error('Refusing to run against production database URL.');
  process.exit(1);
}

const TEST_TITLE_SQL = `
  lower(title) like 'rls-verify-%'
  or lower(title) like 'smoke-%'
  or lower(title) like 'smoke-rej-%'
  or lower(title) like 'reject-reason-verify-%'
  or lower(title) like 'reject-empty-%'
  or lower(title) like 'msg-%'
  or lower(title) like 'msg2-%'
  or lower(title) ~ '^x[0-9]+$'
  or (lower(title) = 'x' and lower(coalesce(category, '')) in ('t', 'test'))
  or lower(title) = 'dd'
`;

function buildPoolerCandidates(databaseUrl) {
  const match = databaseUrl.match(/^postgresql:\/\/postgres(?::([^@]+))?@db\.([a-z0-9-]+)\.supabase\.co:5432\/postgres$/i);
  if (!match) return [databaseUrl];
  const password = encodeURIComponent(match[1] || '');
  const projectRef = match[2];
  return [
    databaseUrl,
    `postgresql://postgres.${projectRef}:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${projectRef}:${password}@aws-1-eu-central-1.pooler.supabase.com:5432/postgres`,
  ];
}

async function connectPg() {
  for (const url of buildPoolerCandidates(env.STAGING_DATABASE_URL)) {
    const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      return client;
    } catch {
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  throw new Error('Could not connect to staging database');
}

const client = await connectPg();

const preview = await client.query(
  `SELECT id, title, status, created_at
   FROM public.listings
   WHERE (${TEST_TITLE_SQL})
   ORDER BY created_at DESC`
);

const publicApproved = preview.rows.filter((row) => row.status === 'approved');

console.log(JSON.stringify({
  projectRef: ref,
  mode: apply ? 'apply' : 'preview',
  testListingsFound: preview.rows.length,
  publicApprovedTestListings: publicApproved.length,
  sample: preview.rows.slice(0, 15).map((row) => ({ id: row.id, title: row.title, status: row.status })),
}, null, 2));

if (apply && preview.rows.length > 0) {
  const updated = await client.query(
    `UPDATE public.listings
     SET status = 'passive', updated_at = now()
     WHERE (${TEST_TITLE_SQL})
       AND status <> 'passive'
     RETURNING id`
  );
  console.log(JSON.stringify({
    testListingsCleaned: updated.rowCount,
    cleanupMethod: 'status=passive',
  }, null, 2));
} else if (!apply) {
  console.log('Preview only. Re-run with --apply to mark matching listings as passive.');
}

await client.end();
