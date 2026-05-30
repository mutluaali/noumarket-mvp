import pg from 'pg';
import fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  })
);

const client = new pg.Client({ connectionString: env.STAGING_DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const tables = ['payment_orders', 'listings', 'profiles'];
for (const table of tables) {
  const { rows } = await client.query(
    `select column_name, data_type from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position`,
    [table]
  );
  console.log(`\n${table}:`);
  console.log(rows.map((r) => r.column_name).join(', '));
}
await client.end();
