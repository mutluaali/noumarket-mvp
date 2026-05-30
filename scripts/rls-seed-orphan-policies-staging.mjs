#!/usr/bin/env node
/**
 * Staging-only: recreate orphan legacy policies to verify patched migration removes them.
 */

import fs from 'node:fs';
import pg from 'pg';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const password = encodeURIComponent(env.STAGING_DATABASE_URL.match(/postgres:([^@]+)@/)[1]);
const url = `postgresql://postgres.pgrrdkuhdoiuqmzafilh:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`;
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const statements = [
  `create policy "Users can create conversations" on public.conversations for insert to authenticated with check ((auth.uid() = buyer_id) or (auth.uid() = seller_id))`,
  `create policy "Users can view their conversations" on public.conversations for select to authenticated using ((auth.uid() = buyer_id) or (auth.uid() = seller_id))`,
  `create policy "Users can update their conversations" on public.conversations for update to authenticated using ((auth.uid() = buyer_id) or (auth.uid() = seller_id))`,
  `create policy "users can create own conversations" on public.conversations for insert to authenticated with check ((auth.uid() = buyer_id) or (auth.uid() = seller_id))`,
  `create policy "users can view own conversations" on public.conversations for select to authenticated using ((auth.uid() = buyer_id) or (auth.uid() = seller_id))`,
  `create policy "users can update own conversations" on public.conversations for update to authenticated using ((auth.uid() = buyer_id) or (auth.uid() = seller_id))`,
  `create policy "Users can send messages in their conversations" on public.messages for insert to authenticated with check ((sender_id = auth.uid()) and (exists (select 1 from public.conversations where conversations.id = messages.conversation_id and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid()))))`,
  `create policy "Users can view messages in their conversations" on public.messages for select to authenticated using (exists (select 1 from public.conversations where conversations.id = messages.conversation_id and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())))`,
  `create policy "users can send messages in own conversations" on public.messages for insert to authenticated with check ((auth.uid() = sender_id) and (exists (select 1 from public.conversations where conversations.id = messages.conversation_id and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid()))))`,
  `create policy "users can view own messages" on public.messages for select to authenticated using (exists (select 1 from public.conversations where conversations.id = messages.conversation_id and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())))`,
  `create policy "Authenticated users can upload" on storage.objects for insert to authenticated with check (bucket_id = 'listing-images')`,
  `create policy "Authenticated users can update" on storage.objects for update to authenticated using (bucket_id = 'listing-images')`,
  `create policy "Authenticated users can delete" on storage.objects for delete to authenticated using (bucket_id = 'listing-images')`,
  `create policy "Public read access" on storage.objects for select using (bucket_id = 'listing-images')`,
];

for (const sql of statements) {
  await client.query(sql);
  console.log('seeded orphan policy');
}

await client.end();
