#!/usr/bin/env node
/**
 * Live staging smoke test — API + permalink view count (no UI mutations beyond read).
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

const app = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const base = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = 'NouE2E-Staging-2026!';
const ref = base?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown';

const results = {};
const failures = [];

function pass(key, detail = 'ok') {
  results[key] = { status: 'PASS', detail };
}

function fail(key, detail) {
  results[key] = { status: 'FAIL', detail };
  failures.push(`${key}: ${detail}`);
}

async function admin(pathname, { method = 'GET', body } = {}) {
  const res = await fetch(`${base}${pathname}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(body ? { Prefer: 'return=representation' } : {}),
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
  return { ok: res.ok, status: res.status, json, text };
}

async function login(email, password) {
  const res = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// Environment
if (base && anon && serviceKey) pass('env', `ref=${ref}`);
else fail('env', 'missing Supabase env');

const bucket = await admin('/storage/v1/bucket/listing-images');
if (bucket.ok) pass('storage', 'listing-images bucket exists');
else fail('storage', bucket.text?.slice(0, 120) || String(bucket.status));

// Users
const profiles = (await admin('/rest/v1/profiles?select=id,role,is_suspended&limit=30')).json || [];
const adminProfile = profiles.find((p) => p.role === 'admin' || p.role === 'moderator');
const userProfile = profiles.find((p) => p.role === 'user' && !p.is_suspended);

let adminEmail = '';
let userEmail = 'alimutlu@gmail.com';

if (adminProfile?.id) {
  const u = await admin(`/auth/v1/admin/users/${adminProfile.id}`);
  adminEmail = u.json?.email || '';
}

// Auth
const userLogin = await login(userEmail, PASSWORD);
if (userLogin.access_token) pass('auth_login', userEmail);
else fail('auth_login', userLogin.error_description || userLogin.msg || 'login failed');

if (adminEmail) {
  const adminLogin = await login(adminEmail, PASSWORD);
  if (adminLogin.access_token) pass('auth_admin_login', adminEmail);
  else fail('auth_admin_login', adminLogin.error_description || 'admin login failed');

  const dash = await fetch(`${app}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${adminLogin.access_token}` },
  });
  if (dash.ok) pass('admin_dashboard', `status ${dash.status}`);
  else fail('admin_dashboard', `status ${dash.status}`);

  const dashUser = await fetch(`${app}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${userLogin.access_token}` },
  });
  if (dashUser.status === 401 || dashUser.status === 403) pass('admin_denied_user', `status ${dashUser.status}`);
  else fail('admin_denied_user', `expected 401/403 got ${dashUser.status}`);
} else {
  fail('auth_admin_login', 'no admin profile');
}

// Listings browse
const home = await fetch(`${app}/api/listings?page=1&pageSize=4`);
if (home.ok) {
  const body = await home.json();
  pass('browse_listings', `${body?.total ?? body?.data?.length ?? 0} listings`);
} else {
  fail('browse_listings', `status ${home.status}`);
}

const approved = (await admin('/rest/v1/listings?select=id,title,view_count,status&status=eq.approved&limit=1')).json?.[0];
if (approved?.id) pass('approved_listing', approved.id);
else fail('approved_listing', 'none found');

// Permalink view count (+1 only)
if (approved?.id) {
  const before = Number(approved.view_count || 0);
  const pageRes = await fetch(`${app}/ilan/${approved.id}`, { redirect: 'follow' });
  await new Promise((r) => setTimeout(r, 800));
  const afterRow = (await admin(`/rest/v1/listings?id=eq.${approved.id}&select=view_count`)).json?.[0];
  const after = Number(afterRow?.view_count || 0);
  const delta = after - before;
  if (pageRes.ok && delta === 1) pass('permalink_view_count', `${before} -> ${after}`);
  else fail('permalink_view_count', `page ${pageRes.status}, delta=${delta} (${before}->${after})`);

  const html = await pageRes.text();
  if (!/mailto:|seller_email/i.test(html)) pass('permalink_no_email', 'ok');
  else fail('permalink_no_email', 'possible email in HTML');
}

// Favorites API
if (userLogin.access_token && approved?.id) {
  const favAdd = await fetch(`${app}/api/favorites`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userLogin.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ listingId: approved.id }),
  });
  const favList = await fetch(`${app}/api/favorites`, {
    headers: { Authorization: `Bearer ${userLogin.access_token}` },
  });
  if (favAdd.ok || favAdd.status === 200) pass('favorites', `add ${favAdd.status}, list ${favList.status}`);
  else fail('favorites', `add status ${favAdd.status}`);
}

// Notifications API
if (userLogin.access_token) {
  const notif = await fetch(`${app}/api/notifications`, {
    headers: { Authorization: `Bearer ${userLogin.access_token}` },
  });
  if (notif.ok) pass('notifications', `status ${notif.status}`);
  else fail('notifications', `status ${notif.status}`);
}

// Messages API
if (userLogin.access_token) {
  const msg = await fetch(`${app}/api/messages`, {
    headers: { Authorization: `Bearer ${userLogin.access_token}` },
  });
  if (msg.ok) pass('messages', `status ${msg.status}`);
  else fail('messages', `status ${msg.status}`);
}

// My listings
if (userLogin.access_token) {
  const mine = await fetch(`${app}/api/my-listings`, {
    headers: { Authorization: `Bearer ${userLogin.access_token}` },
  });
  if (mine.ok) pass('my_listings', `status ${mine.status}`);
  else fail('my_listings', `status ${mine.status}`);
}

// Reports admin inbox
if (adminEmail) {
  const adminLogin = await login(adminEmail, PASSWORD);
  const reports = await fetch(`${app}/api/admin/reports?status=open`, {
    headers: { Authorization: `Bearer ${adminLogin.access_token}` },
  });
  if (reports.ok) pass('admin_reports', `status ${reports.status}`);
  else fail('admin_reports', `status ${reports.status}`);
}

// Pending payments tab API
if (adminEmail) {
  const adminLogin = await login(adminEmail, PASSWORD);
  const pending = await fetch(`${app}/api/admin/payments/pending`, {
    headers: { Authorization: `Bearer ${adminLogin.access_token}` },
  });
  if (pending.ok) pass('admin_pending_payments', `status ${pending.status}`);
  else fail('admin_pending_payments', `status ${pending.status}`);
}

// Sitemap
const sitemap = await fetch(`${app}/sitemap.xml`);
if (sitemap.ok && (await sitemap.text()).includes('/ilan/')) pass('sitemap', 'ok');
else fail('sitemap', `status ${sitemap.status}`);

// Manifest icons
const icon = await fetch(`${app}/icon-192.png`);
if (icon.ok) pass('manifest_icon', `${icon.headers.get('content-type')}`);
else fail('manifest_icon', `status ${icon.status}`);

const summary = {
  smokeTestResult: failures.length ? 'FAIL' : 'PASS',
  supabaseProjectRef: ref,
  appUrl: app,
  failedFlows: failures,
  results,
};

console.log(JSON.stringify(summary, null, 2));
process.exit(failures.length ? 1 : 0);
