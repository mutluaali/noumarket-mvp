#!/usr/bin/env node
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
const app = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LISTING_ID = '046fa226-614b-42ce-81d8-04d59dc6ddc1';
const USER_ID = '5e18336f-1839-4951-83bd-4d48c4c8e195';

async function admin(pathname, opts = {}) {
  const res = await fetch(`${base}${pathname}`, {
    method: opts.method || 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

const sessionId = process.argv[2];
if (!sessionId) {
  console.error('Usage: node e2e-verify-state.mjs <session_id>');
  process.exit(1);
}

const order = await admin(`/rest/v1/payment_orders?provider_session_id=eq.${sessionId}&select=*`);
const listing = await admin(`/rest/v1/listings?id=eq.${LISTING_ID}&select=id,title,is_featured,is_premium,featured_until,premium_until`);
const profile = await admin(`/rest/v1/profiles?id=eq.${USER_ID}&select=id,account_plan,premium_status,premium_ends_at,stripe_customer_id,stripe_subscription_id,listing_photo_limit`);
const events = await admin(`/rest/v1/payment_events?provider_session_id=eq.${sessionId}&select=event_type,status,processed_at&order=created_at.desc`);

const login = await fetch(`${base}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'alimutlu@gmail.com', password: 'NouE2E-Staging-2026!' }),
}).then((r) => r.json());

const verify1 = await fetch(`${app}/api/verify-payment`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.access_token}` },
  body: JSON.stringify({ sessionId }),
});
const verify1Body = await verify1.json();

const verify2 = await fetch(`${app}/api/verify-payment`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.access_token}` },
  body: JSON.stringify({ sessionId }),
});
const verify2Body = await verify2.json();

console.log(JSON.stringify({
  order: order.json?.[0],
  listing: listing.json?.[0],
  profile: profile.json?.[0],
  events: events.json,
  verifyPayment: { first: { status: verify1.status, body: verify1Body }, second: { status: verify2.status, body: verify2Body } },
}, null, 2));
