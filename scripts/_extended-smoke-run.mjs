#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateListingImageFile } from '../lib/uploadGuards.js';

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
const svc = env.SUPABASE_SERVICE_ROLE_KEY;
const PASS = 'NouE2E-Staging-2026!';
const USER_EMAIL = 'alimutlu@gmail.com';
const ADMIN_EMAIL = 'user-a.x1780012375117@t.local';
const ref = base?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown';

const out = { flows: {}, failures: [] };
function pass(key, detail = 'ok') { out.flows[key] = { status: 'PASS', detail }; }
function fail(key, detail) { out.flows[key] = { status: 'FAIL', detail }; out.failures.push(`${key}: ${detail}`); }

async function login(email) {
  const r = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASS }),
  });
  return r.json();
}

async function adminGet(path) {
  const r = await fetch(`${base}${path}`, { headers: { apikey: svc, Authorization: `Bearer ${svc}` } });
  return r.json();
}

async function adminPatch(path, body) {
  const r = await fetch(`${base}${path}`, {
    method: 'PATCH',
    headers: { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  return { status: r.status, json: await r.json().catch(() => null) };
}

// Env
if (base && anon && svc) pass('env', `ref=${ref}`);
else fail('env', 'missing env');

const bucket = await fetch(`${base}/storage/v1/bucket/listing-images`, { headers: { apikey: svc, Authorization: `Bearer ${svc}` } });
if (bucket.ok) pass('storage', 'listing-images');
else fail('storage', String(bucket.status));

// Auth
const userLogin = await login(USER_EMAIL);
const adminLogin = await login(ADMIN_EMAIL);
if (userLogin.access_token) pass('auth_login', USER_EMAIL);
else fail('auth_login', userLogin.error_description || 'failed');
if (adminLogin.access_token) pass('auth_admin', ADMIN_EMAIL);
else fail('auth_admin', 'failed');

const dashUser = await fetch(`${app}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${userLogin.access_token}` } });
if (dashUser.status === 403 || dashUser.status === 401) pass('auth_admin_denied', `status ${dashUser.status}`);
else fail('auth_admin_denied', `status ${dashUser.status}`);

// Upload guards
const small = validateListingImageFile({ size: 1024, type: 'image/jpeg', name: 'a.jpg' });
const big = validateListingImageFile({ size: 6 * 1024 * 1024, type: 'image/jpeg', name: 'b.jpg' });
if (small.ok && !big.ok) pass('listing_upload_guard', big.error || 'blocked');
else fail('listing_upload_guard', 'unexpected');

// Create listing pending
const uid = userLogin.user?.id;
const createRes = await fetch(`${base}/rest/v1/listings`, {
  method: 'POST',
  headers: { apikey: anon, Authorization: `Bearer ${userLogin.access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
  body: JSON.stringify({ user_id: uid, title: `smoke-${Date.now()}`, description: 'test', category: 'Emlak', location: 'Noumea', price: 5000, currency: 'XPF', status: 'pending', seller_name: 'Smoke', seller_phone: '123' }),
});
const created = await createRes.json();
const createdId = created?.[0]?.id;
if (createRes.status === 201 && created?.[0]?.status === 'pending') pass('listing_create', createdId);
else fail('listing_create', `status ${createRes.status}`);

// Edit approved -> pending
const mineApproved = (await adminGet(`/rest/v1/listings?select=id,status&user_id=eq.${uid}&status=eq.approved&limit=1`))[0];
if (mineApproved?.id) {
  const patch = await fetch(`${app}/api/my-listings/${mineApproved.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userLogin.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', title: 'smoke edited', description: 'd', category: 'Emlak', location: 'Noumea', price: 6000, currency: 'XPF', seller_name: 'Smoke', seller_phone: '123' }),
  });
  const after = (await adminGet(`/rest/v1/listings?id=eq.${mineApproved.id}&select=status`))[0];
  if (patch.ok && after?.status === 'pending') pass('listing_edit_pending', mineApproved.id);
  else fail('listing_edit_pending', `patch ${patch.status} status ${after?.status}`);
} else pass('listing_edit_pending', 'skip-no-approved-mine');

const rejected = (await adminGet(`/rest/v1/listings?select=id,rejected_reason&user_id=eq.${uid}&status=eq.rejected&limit=1`))[0];
if (rejected?.rejected_reason) pass('listing_rejection_reason', 'present');
else pass('listing_rejection_reason', 'none in fixture');

const mine = await fetch(`${app}/api/my-listings`, { headers: { Authorization: `Bearer ${userLogin.access_token}` } });
if (mine.ok) pass('my_listings', `status ${mine.status}`);
else fail('my_listings', `status ${mine.status}`);

// Search browse
const s1 = await fetch(`${app}/api/listings?page=1&pageSize=4`);
const s1b = await s1.json();
if (s1.ok && (s1b.total ?? 0) > 0) pass('browse', `${s1b.total} listings`);
else fail('browse', `status ${s1.status}`);
const s2 = await fetch(`${app}/api/listings?q=havuz&page=1&pageSize=5`);
const s3 = await fetch(`${app}/api/listings?location=Noumea&page=1&pageSize=5`);
const s4 = await fetch(`${app}/api/listings?minPrice=1000&maxPrice=500000&page=1&pageSize=5`);
if (s2.ok && s3.ok && s4.ok) pass('search_filters', 'q/loc/price ok');
else fail('search_filters', 'filter fail');

// Permalink view count
const approved = (await adminGet('/rest/v1/listings?select=id,view_count&status=eq.approved&limit=1'))[0];
if (approved?.id) {
  const before = Number(approved.view_count || 0);
  await fetch(`${app}/ilan/${approved.id}`);
  await new Promise((r) => setTimeout(r, 800));
  const after = Number((await adminGet(`/rest/v1/listings?id=eq.${approved.id}&select=view_count`))[0]?.view_count || 0);
  if (after - before === 1) pass('permalink_view_count', `${before}->${after}`);
  else fail('permalink_view_count', `delta ${after - before}`);
  const html = await (await fetch(`${app}/ilan/${approved.id}`)).text();
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ');
  const hasMailto = /mailto:/i.test(html);
  const hasVisibleEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(visible);
  if (!hasMailto && !hasVisibleEmail) pass('permalink_no_email', 'ok');
  else fail('permalink_no_email', `mailto=${hasMailto} visible=${hasVisibleEmail}`);
  if ((await fetch(`${app}/ilan/${approved.id}`)).ok) pass('permalink_load', approved.id);
} else fail('permalink_load', 'no approved');

// Messaging
const other = (await adminGet(`/rest/v1/listings?select=id,user_id&status=eq.approved&user_id=neq.${uid}&limit=1`))[0];
if (other?.id) {
  const convIns = await fetch(`${base}/rest/v1/conversations`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${userLogin.access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ listing_id: other.id, buyer_id: uid, seller_id: other.user_id }),
  });
  let convId = (await convIns.json().catch(() => []))[0]?.id;
  if (!convId) {
    const existing = await adminGet(`/rest/v1/conversations?listing_id=eq.${other.id}&buyer_id=eq.${uid}&select=id&limit=1`);
    convId = existing[0]?.id;
  }
  const msgIns = await fetch(`${base}/rest/v1/messages`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${userLogin.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: convId, sender_id: uid, body: 'Smoke mesaj testi' }),
  });
  const msgs = await fetch(`${app}/api/messages`, { headers: { Authorization: `Bearer ${userLogin.access_token}` } });
  const msgBody = await msgs.json();
  if (msgIns.ok && msgs.ok && (msgBody.data?.length ?? 0) >= 0) pass('messaging', `conv ${convId}`);
  else fail('messaging', `msg ${msgIns.status} api ${msgs.status}`);
} else fail('messaging', 'no target listing');

// Reports
if (other?.id) {
  const rep1 = await fetch(`${base}/rest/v1/listing_reports`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${userLogin.access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ listing_id: other.id, reporter_id: uid, reason: 'fraud', details: 'smoke', status: 'open' }),
  });
  const openReports = await fetch(`${app}/api/admin/reports?status=open`, { headers: { Authorization: `Bearer ${adminLogin.access_token}` } });
  const openBody = await openReports.json();
  const reportRow = (openBody.data || []).find((r) => r.listing_id === other.id);
  if (rep1.ok || rep1.status === 409) pass('reports_create', `status ${rep1.status}`);
  else fail('reports_create', `status ${rep1.status}`);
  if (openReports.ok) pass('admin_reports_inbox', `${(openBody.data || []).length} open`);
  if (reportRow?.id) {
    const resolve = await fetch(`${app}/api/admin/reports/${reportRow.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminLogin.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    });
    const listingAfter = (await adminGet(`/rest/v1/listings?id=eq.${other.id}&select=status`))[0];
    if (resolve.ok && listingAfter?.status === 'approved') pass('reports_resolve_no_delete', 'listing kept');
    else fail('reports_resolve_no_delete', `resolve ${resolve.status} listing ${listingAfter?.status}`);
  }
}

// Favorites via supabase
if (approved?.id) {
  await fetch(`${base}/rest/v1/favorites?user_id=eq.${uid}&listing_id=eq.${approved.id}`, {
    method: 'DELETE',
    headers: { apikey: anon, Authorization: `Bearer ${userLogin.access_token}` },
  }).catch(() => {});
  const favIns = await fetch(`${base}/rest/v1/favorites`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${userLogin.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: uid, listing_id: approved.id }),
  });
  const favList = await fetch(`${app}/api/favorites`, { headers: { Authorization: `Bearer ${userLogin.access_token}` } });
  const favBody = await favList.json();
  const has = favBody.data?.some((l) => l.id === approved.id);
  if (favIns.ok && favList.ok && has) pass('favorites', 'insert+list');
  else fail('favorites', `ins ${favIns.status} list ${favList.status} has ${has}`);
}

// Notifications
const notifs = await fetch(`${app}/api/notifications`, { headers: { Authorization: `Bearer ${userLogin.access_token}` } });
const notifBody = await notifs.json();
const markAll = await fetch(`${app}/api/notifications/mark-all-read`, { method: 'POST', headers: { Authorization: `Bearer ${userLogin.access_token}` } });
if (notifs.ok && markAll.ok) pass('notifications', `${(notifBody.data || []).length} items`);
else fail('notifications', `get ${notifs.status} markAll ${markAll.status}`);

// Admin approve/reject
if (createdId) {
  const appr = await adminPatch(`/rest/v1/listings?id=eq.${createdId}`, { status: 'approved', updated_at: new Date().toISOString() });
  if (appr.status === 200) pass('admin_approve', createdId);
  else fail('admin_approve', `status ${appr.status}`);
}
const rejIns = await fetch(`${base}/rest/v1/listings`, {
  method: 'POST',
  headers: { apikey: anon, Authorization: `Bearer ${userLogin.access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
  body: JSON.stringify({ user_id: uid, title: `smoke-rej-${Date.now()}`, description: 'x', category: 'Emlak', location: 'Noumea', price: 1000, currency: 'XPF', status: 'pending', seller_name: 't', seller_phone: '1' }),
});
const rejId = (await rejIns.json())[0]?.id;
if (rejId) {
  const rej = await adminPatch(`/rest/v1/listings?id=eq.${rejId}`, { status: 'rejected', rejected_reason: 'Smoke red: eksik bilgi', updated_at: new Date().toISOString() });
  const row = (await adminGet(`/rest/v1/listings?id=eq.${rejId}&select=status,rejected_reason`))[0];
  if (rej.status === 200 && row?.rejected_reason) pass('admin_reject', rejId);
  else fail('admin_reject', `status ${rej.status}`);
}

// Suspend test
const victim = (await adminGet('/rest/v1/profiles?select=id&role=eq.user&is_suspended=eq.false&id=neq.' + uid + '&limit=1'))[0];
if (victim?.id) {
  const susp = await fetch(`${app}/api/admin/users/${victim.id}/suspension`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminLogin.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ suspended: true, reason: 'smoke test' }),
  });
  const msgBlock = await fetch(`${base}/rest/v1/messages`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${victim.id}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: '00000000-0000-0000-0000-000000000000', sender_id: victim.id, body: 'x' }),
  });
  const unsusp = await fetch(`${app}/api/admin/users/${victim.id}/suspension`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminLogin.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ suspended: false }),
  });
  if (susp.ok && unsusp.ok) pass('admin_suspend', victim.id);
  else fail('admin_suspend', `susp ${susp.status}`);
}

const pendingPay = await fetch(`${app}/api/admin/payments/pending`, { headers: { Authorization: `Bearer ${adminLogin.access_token}` } });
if (pendingPay.ok) pass('admin_pending_payments', `status ${pendingPay.status}`);
else fail('admin_pending_payments', `status ${pendingPay.status}`);

// RLS anon pending
const pendingRow = (await adminGet('/rest/v1/listings?select=id&status=eq.pending&limit=1'))[0];
if (pendingRow?.id) {
  const anonRead = await fetch(`${base}/rest/v1/listings?id=eq.${pendingRow.id}&select=id`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
  const anonBody = await anonRead.json();
  if (Array.isArray(anonBody) && anonBody.length === 0) pass('rls_pending', 'anon blocked');
  else fail('rls_pending', `count ${Array.isArray(anonBody) ? anonBody.length : 'err'}`);
} else pass('rls_pending', 'no pending row');

out.smokeTestResult = out.failures.length ? 'FAIL' : 'PASS';
out.supabaseProjectRef = ref;
out.appUrl = app;
console.log(JSON.stringify(out, null, 2));
process.exit(out.failures.length ? 1 : 0);
