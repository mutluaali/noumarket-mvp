#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: profiles } = await supabase
  .from('profiles')
  .select('id, role, account_plan, premium_status, is_suspended, display_name')
  .in('role', ['user', 'admin', 'moderator'])
  .limit(20);

const emails = {};
for (const p of profiles || []) {
  const { data: userData } = await supabase.auth.admin.getUserById(p.id);
  emails[p.id] = userData?.user?.email || null;
}

console.log(
  'USERS',
  JSON.stringify(
    (profiles || []).map((p) => ({ ...p, email: emails[p.id] })),
    null,
    2
  )
);

const { data: listings } = await supabase
  .from('listings')
  .select('id, user_id, title, status, is_featured, featured_until, premium_until')
  .eq('status', 'approved')
  .limit(5);
console.log('LISTINGS', JSON.stringify(listings, null, 2));

const { data: orders } = await supabase
  .from('payment_orders')
  .select('id, status, product_type, amount, user_id, listing_id, provider_session_id, created_at')
  .order('created_at', { ascending: false })
  .limit(10);
console.log('ORDERS', JSON.stringify(orders, null, 2));
