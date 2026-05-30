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
  return [databaseUrl, `postgresql://postgres.${ref}:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`];
}

const client = new pg.Client({ connectionString: buildPoolerCandidates(env.STAGING_DATABASE_URL)[0], ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
} catch {
  const client2 = new pg.Client({ connectionString: buildPoolerCandidates(env.STAGING_DATABASE_URL)[1], ssl: { rejectUnauthorized: false } });
  await client2.connect();
  await client2.query(`
    alter table public.profiles add column if not exists is_suspended boolean not null default false;
    alter table public.profiles add column if not exists suspended_at timestamptz;
    alter table public.profiles add column if not exists suspended_by uuid;
    alter table public.profiles add column if not exists suspension_reason text;
    notify pgrst, 'reload schema';
  `);
  console.log('suspension columns applied');
  await client2.end();
  process.exit(0);
}

await client.query(`
  alter table public.profiles add column if not exists is_suspended boolean not null default false;
  alter table public.profiles add column if not exists suspended_at timestamptz;
  alter table public.profiles add column if not exists suspended_by uuid;
  alter table public.profiles add column if not exists suspension_reason text;
  notify pgrst, 'reload schema';
`);
console.log('suspension columns applied');
await client.end();
