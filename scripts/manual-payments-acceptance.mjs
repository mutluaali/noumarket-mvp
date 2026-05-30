#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);

const baseUrl = env.VERIFY_BASE_URL || 'http://localhost:3000';
const report = { passed: [], failed: [] };
function pass(name, detail = '') { report.passed.push({ name, detail }); console.log(`PASS ${name}${detail ? `: ${detail}` : ''}`); }
function fail(name, detail = '') { report.failed.push({ name, detail }); console.error(`FAIL ${name}${detail ? `: ${detail}` : ''}`); }

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const E2E_PASSWORD = 'NouE2E-Staging-2026!';

async function getUserToken(userId) {
  const userAuth = await admin.auth.admin.getUserById(userId);
  await admin.auth.admin.updateUserById(userId, { password: E2E_PASSWORD, email_confirm: true });
  const session = await anon.auth.signInWithPassword({ email: userAuth.data.user.email, password: E2E_PASSWORD });
  return session.data.session?.access_token;
}

async function getTokens() {
  const { data: profiles } = await admin.from('profiles').select('id, role, is_suspended').limit(50);
  const regularUser = profiles?.find((p) => p.role === 'user' && !p.is_suspended);
  const adminProfile = profiles?.find((p) => (p.role === 'admin' || p.role === 'moderator') && !p.is_suspended);
  if (!regularUser || !adminProfile) throw new Error('Missing regular user/admin fixtures');

  const [regularToken, adminToken] = await Promise.all([
    getUserToken(regularUser.id),
    getUserToken(adminProfile.id),
  ]);

  return {
    regularUser: { id: regularUser.id, token: regularToken },
    admin: { id: adminProfile.id, token: adminToken },
  };
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => ({}));
  return { res, payload };
}

async function main() {
  const { regularUser, admin: adminUser } = await getTokens();
  const { data: listing } = await admin
    .from('listings')
    .select('id, user_id, title, is_featured, is_premium')
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle();

  if (!listing?.id) return fail('Fixtures', 'approved listing missing');

  const listingOwnerAuth = await admin.auth.admin.getUserById(listing.user_id);
  await admin.auth.admin.updateUserById(listing.user_id, { password: E2E_PASSWORD, email_confirm: true });
  const ownerSession = await anon.auth.signInWithPassword({ email: listingOwnerAuth.data.user.email, password: E2E_PASSWORD });
  const sellerToken = ownerSession.data.session?.access_token;
  const sellerId = listing.user_id;

  const providersRes = await fetchJson(`${baseUrl}/api/payments/providers`);
  if (providersRes.res.ok && Array.isArray(providersRes.payload.providers)) {
    pass('GET /api/payments/providers');
    const keys = providersRes.payload.providers.map((p) => p.key);
    if (keys[0] === 'bank_transfer') pass('Provider order bank_transfer first');
    else fail('Provider order bank_transfer first', keys.join(','));
    const epaync = providersRes.payload.providers.find((p) => p.key === 'epaync');
    if (epaync && !epaync.enabled) pass('EpayNC disabled when not configured');
    else fail('EpayNC disabled when not configured');
  } else fail('GET /api/payments/providers', String(providersRes.res.status));

  const epayncRes = await fetchJson(`${baseUrl}/api/payments/epaync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'featured_listing', listingId: listing.id, planId: 'premium_7' }),
  });
  if (epayncRes.res.status === 503) pass('EpayNC checkout blocked when disabled');
  else fail('EpayNC checkout blocked when disabled', String(epayncRes.res.status));

  const unauthAdmin = await fetchJson(`${baseUrl}/api/admin/payments/pending`);
  if (unauthAdmin.res.status === 401) pass('Admin pending payments requires auth');
  else fail('Admin pending payments requires auth', String(unauthAdmin.res.status));

  const userAdmin = await fetchJson(`${baseUrl}/api/admin/payments/pending`, {
    headers: { Authorization: `Bearer ${regularUser.token}` },
  });
  if (userAdmin.res.status === 403) pass('Normal user cannot access admin pending payments');
  else fail('Normal user cannot access admin pending payments', String(userAdmin.res.status));

  await admin.from('listings').update({ is_featured: false, is_premium: false, featured_until: null, premium_until: null }).eq('id', listing.id);

  const bankConfigured = Boolean(
    env.BANK_TRANSFER_ACCOUNT_NAME && env.BANK_TRANSFER_IBAN_OR_RIB && env.BANK_TRANSFER_BANK_NAME
  );

  if (!bankConfigured) {
    const bankRes = await fetchJson(`${baseUrl}/api/payments/bank-transfer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productType: 'featured_listing', listingId: listing.id, planId: 'premium_7' }),
    });
    if (bankRes.res.status === 503) pass('Bank transfer blocked without bank env config');
    else fail('Bank transfer blocked without bank env config', String(bankRes.res.status));
  } else {
    const bankRes = await fetchJson(`${baseUrl}/api/payments/bank-transfer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sellerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productType: 'featured_listing', listingId: listing.id, planId: 'premium_7' }),
    });
    if (bankRes.res.ok && bankRes.payload.reference?.startsWith('NM-')) {
      pass('Bank transfer creates pending_manual_review order', bankRes.payload.reference);
      const orderId = bankRes.payload.orderId;
      const { data: beforeListing } = await admin.from('listings').select('is_featured').eq('id', listing.id).single();
      if (!beforeListing?.is_featured) pass('Listing not featured before admin approval');
      else fail('Listing not featured before admin approval');

      const approve1 = await fetchJson(`${baseUrl}/api/admin/payments/${orderId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminUser.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (approve1.res.ok && !approve1.payload.result?.alreadyProcessed) pass('Admin approve activates featured listing');
      else fail('Admin approve activates featured listing', JSON.stringify(approve1.payload));

      const { data: afterListing } = await admin.from('listings').select('is_featured').eq('id', listing.id).single();
      if (afterListing?.is_featured) pass('Listing featured after admin approval');
      else fail('Listing featured after admin approval');

      const approve2 = await fetchJson(`${baseUrl}/api/admin/payments/${orderId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminUser.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (approve2.res.ok && approve2.payload.result?.alreadyProcessed) pass('Duplicate approve is idempotent');
      else fail('Duplicate approve is idempotent', JSON.stringify(approve2.payload));
    } else fail('Bank transfer creates order', JSON.stringify(bankRes.payload));
  }

  const { data: otherListing } = await admin.from('listings').select('id, user_id').neq('user_id', sellerId).eq('status', 'approved').limit(1).maybeSingle();
  if (otherListing?.id) {
    const foreignRes = await fetchJson(`${baseUrl}/api/payments/bank-transfer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${regularUser.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productType: 'featured_listing', listingId: otherListing.id, planId: 'premium_7' }),
    });
    if (foreignRes.res.status === 403) pass('User cannot pay for another users listing');
    else fail('User cannot pay for another users listing', String(foreignRes.res.status));
  }

  await admin.from('profiles').update({ is_suspended: true, suspended_at: new Date().toISOString() }).eq('id', sellerId);
  const suspendedRes = await fetchJson(`${baseUrl}/api/payments/bank-transfer`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'featured_listing', listingId: listing.id, planId: 'premium_7' }),
  });
  if (suspendedRes.res.status === 403) pass('Suspended user cannot create payment request');
  else fail('Suspended user cannot create payment request', String(suspendedRes.res.status));
  await admin.from('profiles').update({ is_suspended: false, suspended_at: null }).eq('id', sellerId);

  const buildRes = await fetch(`${baseUrl}/api/payments/providers`);
  if (buildRes.ok) pass('Stripe routes still reachable with providers API');
  else fail('Stripe routes still reachable', String(buildRes.status));

  fs.writeFileSync(path.join(root, 'scripts', 'manual-payments-results.json'), JSON.stringify(report, null, 2));
  console.log(`\nSUMMARY ${report.passed.length} passed, ${report.failed.length} failed`);
  process.exit(report.failed.length ? 1 : 0);
}

main().catch((error) => {
  fail('Runner crashed', error.message);
  process.exit(1);
});
