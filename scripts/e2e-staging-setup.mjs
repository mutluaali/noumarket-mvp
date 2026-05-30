#!/usr/bin/env node
/**
 * Staging E2E helper: query fixtures + set temp password for browser login.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const base = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const E2E_PASSWORD = 'NouE2E-Staging-2026!';

async function admin(pathname, { method = 'GET', body } = {}) {
  const res = await fetch(`${base}${pathname}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  if (!res.ok) throw new Error(`${method} ${pathname} ${res.status}: ${text.slice(0, 400)}`);
  return json;
}

const profiles = await admin('/rest/v1/profiles?select=id,role,account_plan,premium_status,is_suspended,listing_photo_limit&role=in.(user,admin,moderator)&limit=20');
const usersWithEmail = [];
for (const p of profiles) {
  const u = await admin(`/auth/v1/admin/users/${p.id}`);
  usersWithEmail.push({ ...p, email: u.email });
}
console.log('USERS', JSON.stringify(usersWithEmail, null, 2));

const listings = await admin('/rest/v1/listings?select=id,user_id,title,status,is_featured,featured_until,premium_until&status=eq.approved&limit=5');
console.log('LISTINGS', JSON.stringify(listings, null, 2));

const orders = await admin('/rest/v1/payment_orders?select=id,status,product_type,amount,user_id,listing_id,provider_session_id,created_at&order=created_at.desc&limit=10');
console.log('ORDERS', JSON.stringify(orders, null, 2));

const seller = usersWithEmail.find((u) => u.role === 'user' && !u.is_suspended);
const adminUser = usersWithEmail.find((u) => u.role === 'admin' || u.role === 'moderator');
const listing = listings.find((l) => l.user_id === seller?.id) || listings[0];

if (seller?.id) {
  await admin(`/auth/v1/admin/users/${seller.id}`, {
    method: 'PUT',
    body: { password: E2E_PASSWORD, email_confirm: true },
  });
  console.log('SELLER_LOGIN', JSON.stringify({ email: seller.email, password: E2E_PASSWORD, id: seller.id }, null, 2));
}

if (adminUser?.id) {
  await admin(`/auth/v1/admin/users/${adminUser.id}`, {
    method: 'PUT',
    body: { password: E2E_PASSWORD, email_confirm: true },
  });
  console.log('ADMIN_LOGIN', JSON.stringify({ email: adminUser.email, password: E2E_PASSWORD, id: adminUser.id }, null, 2));
}

console.log('FIXTURE', JSON.stringify({ seller, adminUser, listing }, null, 2));
