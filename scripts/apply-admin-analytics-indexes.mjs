#!/usr/bin/env node
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const PROJECT_REF = 'pgrrdkuhdoiuqmzafilh';
const INDEX_NAMES = [
  'idx_messages_created_at',
  'idx_favorites_created_at',
  'idx_profiles_created_at',
  'idx_listings_status_created_at',
  'idx_listings_approved_category',
  'idx_listings_approved_location',
];

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
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  throw new Error('Could not connect to Postgres');
}

async function measureDashboard(appUrl) {
  const base = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const loginRes = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user-a.x1780012375117@t.local', password: 'NouE2E-Staging-2026!' }),
  });
  const { access_token: token } = await loginRes.json();
  const times = [];
  for (let i = 0; i < 3; i += 1) {
    const started = Date.now();
    const response = await fetch(`${appUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await response.json();
    times.push(Date.now() - started);
  }
  return Math.round(times.reduce((sum, value) => sum + value, 0) / times.length);
}

async function verifyMetrics(supabase) {
  const mod = await import(pathToFileURL(path.join(root, 'lib', 'productMetrics.js')).href);
  const { buildProductInsights, startOfLocalDay, fetchTableCount } = mod;
  const todayStart = startOfLocalDay().toISOString();
  const last7Start = startOfLocalDay(6).toISOString();
  const last30Start = startOfLocalDay(29).toISOString();
  const insights = await buildProductInsights(supabase);
  const checks = [
    ['profiles.total', (await fetchTableCount(supabase, 'profiles')).count, insights.registrations?.total],
    ['listings.createdTotal', (await fetchTableCount(supabase, 'listings')).count, insights.listings?.createdTotal],
    ['listings.approved', (await fetchTableCount(supabase, 'listings', [{ op: 'eq', column: 'status', value: 'approved' }])).count, insights.listings?.approved],
    ['listings.rejected', (await fetchTableCount(supabase, 'listings', [{ op: 'eq', column: 'status', value: 'rejected' }])).count, insights.listings?.rejected],
    ['messages.total', (await fetchTableCount(supabase, 'messages')).count, insights.messages?.total],
    ['reports.total', (await fetchTableCount(supabase, 'listing_reports')).count, insights.reports?.total],
    ['favorites.total', (await fetchTableCount(supabase, 'favorites')).count, insights.favorites?.total],
    ['profiles.today', (await fetchTableCount(supabase, 'profiles', [{ op: 'gte', column: 'created_at', value: todayStart }])).count, insights.registrations?.today],
    ['profiles.last7Days', (await fetchTableCount(supabase, 'profiles', [{ op: 'gte', column: 'created_at', value: last7Start }])).count, insights.registrations?.last7Days],
    ['profiles.last30Days', (await fetchTableCount(supabase, 'profiles', [{ op: 'gte', column: 'created_at', value: last30Start }])).count, insights.registrations?.last30Days],
  ];
  const mismatches = checks.filter(([, expected, actual]) => expected !== actual);
  return { pass: mismatches.length === 0, mismatches };
}

async function listIndexes(client) {
  const { rows } = await client.query(
    `SELECT indexname
     FROM pg_indexes
     WHERE schemaname = 'public'
       AND indexname = ANY($1::text[])`,
    [INDEX_NAMES]
  );
  return rows.map((row) => row.indexname).sort();
}

const appUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let timingBefore = null;
try {
  timingBefore = await measureDashboard(appUrl);
} catch (error) {
  timingBefore = `unavailable: ${error.message}`;
}

const client = await connectPg();
const indexesBefore = await listIndexes(client);
const migrationSql = fs.readFileSync(path.join(root, 'sql', '2026-05-29-admin-analytics-indexes.sql'), 'utf8');

await client.query(migrationSql);
await client.query(`notify pgrst, 'reload schema';`);

const indexesAfter = await listIndexes(client);
await client.end();

const timingAfter = await measureDashboard(appUrl);
const metrics = await verifyMetrics(supabase);

console.log(JSON.stringify({
  projectRef: PROJECT_REF,
  migrationApplied: true,
  idempotent: migrationSql.includes('create index if not exists'),
  indexesBefore,
  indexesAfter,
  indexesVerified: INDEX_NAMES.every((name) => indexesAfter.includes(name)),
  metricsAccuracy: metrics.pass ? 'PASS' : 'FAIL',
  mismatches: metrics.mismatches,
  dashboardTimingBeforeMs: timingBefore,
  dashboardTimingAfterMs: timingAfter,
}, null, 2));
