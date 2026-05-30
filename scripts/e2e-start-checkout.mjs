#!/usr/bin/env node
/** Get seller access token + start featured checkout */
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

const EMAIL = 'alimutlu@gmail.com';
const PASSWORD = 'NouE2E-Staging-2026!';
const LISTING_ID = '046fa226-614b-42ce-81d8-04d59dc6ddc1';
const USER_ID = '5e18336f-1839-4951-83bd-4d48c4c8e195';
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const app = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const loginRes = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: anon, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const login = await loginRes.json();
if (!login.access_token) {
  console.error('LOGIN_FAILED', login);
  process.exit(1);
}

async function checkout(productType, extra = {}) {
  const res = await fetch(`${app}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.access_token}` },
    body: JSON.stringify({ productType, userId: USER_ID, ...extra }),
  });
  const body = await res.json();
  return { status: res.status, body };
}

const featured = await checkout('featured_listing', { listingId: LISTING_ID, planId: 'premium_7' });
console.log('FEATURED_CHECKOUT', JSON.stringify(featured, null, 2));
