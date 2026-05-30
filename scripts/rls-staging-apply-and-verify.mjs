#!/usr/bin/env node
/**
 * Staging/local RLS consolidation apply + verify.
 * Requires STAGING_DATABASE_URL (Supabase Postgres connection string).
 * Does NOT touch production unless that URL points at production.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

const env = {
  ...loadEnvFile(path.join(root, '.env.local')),
  ...process.env,
};

const databaseUrl = env.STAGING_DATABASE_URL || env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing STAGING_DATABASE_URL (or DATABASE_URL).');
  console.error('Set a Supabase Postgres connection string for staging/local only.');
  process.exit(1);
}

if (/prod|production/i.test(databaseUrl) && !env.ALLOW_PRODUCTION_DATABASE) {
  console.error('Refusing to run: connection string looks like production.');
  console.error('Set ALLOW_PRODUCTION_DATABASE=1 only if you intentionally target production.');
  process.exit(1);
}

const inventoryPath = path.join(root, 'sql', 'production-rls-inventory-readonly.sql');
const migrationPath = path.join(root, 'sql', '2026-05-29-rls-consolidation.sql');

const policyCountQuery = `
SELECT tablename, cmd AS command, count(*) AS policy_count,
       string_agg(policyname, ' | ' ORDER BY policyname) AS policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('listings', 'listing_images', 'profiles', 'messages', 'conversations', 'listing_reports')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;
`;

const storagePolicyQuery = `
SELECT policyname, cmd AS command, qual AS using_expression, with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname, cmd;
`;

function buildPoolerCandidates(databaseUrl) {
  const match = databaseUrl.match(/^postgresql:\/\/postgres(?::([^@]+))?@db\.([a-z0-9-]+)\.supabase\.co:5432\/postgres$/i);
  if (!match) return [];

  const password = encodeURIComponent(match[1] || '');
  const ref = match[2];
  const regions = ['ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'eu-central-1', 'us-east-1'];
  const prefixes = ['aws-1', 'aws-0'];
  const ports = [5432, 6543];
  const urls = [];

  for (const prefix of prefixes) {
    for (const region of regions) {
      for (const port of ports) {
        urls.push(`postgresql://postgres.${ref}:${password}@${prefix}-${region}.pooler.supabase.com:${port}/postgres`);
      }
    }
  }

  urls.push(`postgresql://postgres.${ref}:${password}@db.${ref}.supabase.co:6543/postgres`);
  return urls;
}

async function connectPg(databaseUrl) {
  const candidates = [databaseUrl, ...buildPoolerCandidates(databaseUrl)];
  const tried = new Set();
  let lastError;

  for (const candidate of candidates) {
    if (!candidate || tried.has(candidate)) continue;
    tried.add(candidate);

    const client = new pg.Client({
      connectionString: candidate,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      await client.connect();
      if (candidate !== databaseUrl) {
        console.log(`Connected via pooler: ${candidate.replace(/:[^:@/]+@/, ':***@')}`);
      }
      return client;
    } catch (error) {
      lastError = error;
      try {
        await client.end();
      } catch {
        // ignore
      }
    }
  }

  throw lastError || new Error('Unable to connect to staging database.');
}

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let dollarTag = null;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];

    if (!inSingle && !inDouble && !dollarTag && ch === '$') {
      const rest = sql.slice(i);
      const match = rest.match(/^\$([A-Za-z0-9_]*)\$/);
      if (match) {
        dollarTag = match[1];
        current += match[0];
        i += match[0].length - 1;
        continue;
      }
    } else if (dollarTag !== null) {
      const close = `$${dollarTag}$`;
      if (sql.startsWith(close, i)) {
        current += close;
        i += close.length - 1;
        dollarTag = null;
        continue;
      }
    }

    if (!dollarTag && !inDouble && ch === "'" ) {
      inSingle = !inSingle;
    } else if (!dollarTag && !inSingle && ch === '"') {
      inDouble = !inDouble;
    }

    if (ch === ';' && !inSingle && !inDouble && dollarTag === null) {
      const trimmed = current.trim();
      if (trimmed && !trimmed.startsWith('--')) statements.push(trimmed);
      current = '';
      continue;
    }

    current += ch;
  }

  const tail = current.trim();
  if (tail && !tail.startsWith('--')) statements.push(tail);
  return statements;
}

async function runQuery(client, sql) {
  const result = await client.query(sql);
  return result.rows;
}

async function runSqlFile(client, filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  await client.query(raw);
}

async function main() {
  const client = await connectPg(databaseUrl);

  try {
    const before = await runQuery(client, policyCountQuery);
    const beforeStorage = await runQuery(client, storagePolicyQuery);

    console.log('=== BEFORE POLICY COUNTS ===');
    console.table(before);
    console.log('=== BEFORE STORAGE POLICIES ===');
    console.table(beforeStorage);

    console.log('\nApplying migration:', migrationPath);
    await runSqlFile(client, migrationPath);

    const after = await runQuery(client, policyCountQuery);
    const afterStorage = await runQuery(client, storagePolicyQuery);

    console.log('\n=== AFTER POLICY COUNTS ===');
    console.table(after);
    console.log('=== AFTER STORAGE POLICIES ===');
    console.table(afterStorage);

    fs.writeFileSync(path.join(root, 'scripts', 'rls-inventory-before.json'), JSON.stringify({ policies: before, storage: beforeStorage }, null, 2));
    fs.writeFileSync(path.join(root, 'scripts', 'rls-inventory-after.json'), JSON.stringify({ policies: after, storage: afterStorage }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
