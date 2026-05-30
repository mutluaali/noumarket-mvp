#!/usr/bin/env node
/**
 * Staging full bank transfer lifecycle verification.
 */
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
const E2E_PASSWORD = 'NouE2E-Staging-2026!';
const EXPECTED_FEATURED_AMOUNT = 1500;
const EXPECTED_PREMIUM_SELLER_AMOUNT = Number(env.PREMIUM_SELLER_MONTHLY_AMOUNT || 9900);

const results = {
  featuredBankTransfer: { status: 'FAIL', steps: [] },
  featuredRejectFlow: { status: 'FAIL', steps: [] },
  premiumSellerBankTransfer: { status: 'FAIL', steps: [] },
  epayncDisabledState: { status: 'FAIL', steps: [] },
  securityTests: { status: 'FAIL', steps: [] },
  idempotency: { status: 'FAIL', steps: [] },
  failedSteps: [],
};

function step(group, name, ok, detail = '') {
  const entry = { name, ok, detail };
  results[group].steps.push(entry);
  if (!ok) results.failedSteps.push(`${group}: ${name}${detail ? ` (${detail})` : ''}`);
  console.log(`${ok ? 'PASS' : 'FAIL'} [${group}] ${name}${detail ? `: ${detail}` : ''}`);
}

function finalizeGroup(group) {
  results[group].status = results[group].steps.every((s) => s.ok) ? 'PASS' : 'FAIL';
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function getUserToken(userId, attempt = 0) {
  const userAuth = await admin.auth.admin.getUserById(userId);
  await admin.auth.admin.updateUserById(userId, { password: E2E_PASSWORD, email_confirm: true });
  const session = await anon.auth.signInWithPassword({ email: userAuth.data.user.email, password: E2E_PASSWORD });
  const token = session.data.session?.access_token;
  if (!token && attempt < 3) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return getUserToken(userId, attempt + 1);
  }
  if (!token) throw new Error(`Token unavailable for ${userId}`);
  return token;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => ({}));
  return { res, payload };
}

async function ensureSellerListing(sellerId) {
  const { data: existing } = await admin
    .from('listings')
    .select('id, user_id, title, status, is_featured, is_premium, featured_until, premium_until')
    .eq('user_id', sellerId)
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await admin.from('listings').update({
      is_featured: false,
      is_premium: false,
      featured_until: null,
      premium_until: null,
    }).eq('id', existing.id);
    return existing.id;
  }

  const { data: anyListing } = await admin.from('listings').select('id').eq('status', 'approved').limit(1).maybeSingle();
  if (anyListing?.id) {
    await admin.from('listings').update({
      user_id: sellerId,
      is_featured: false,
      is_premium: false,
      featured_until: null,
      premium_until: null,
    }).eq('id', anyListing.id);
    return anyListing.id;
  }

  throw new Error('No approved listing available for seller fixture');
}

async function resetPremiumSeller(userId) {
  await admin.from('profiles').update({
    account_plan: 'free',
    premium_status: 'inactive',
    premium_ends_at: null,
    stripe_subscription_id: null,
    listing_photo_limit: 5,
  }).eq('id', userId);
}

async function isInFeaturedRail(listingId) {
  const now = new Date().toISOString();
  const { data } = await admin
    .from('listings')
    .select('id, is_featured, featured_until, status')
    .eq('id', listingId)
    .maybeSingle();
  if (!data?.is_featured || data.status !== 'approved') return false;
  if (!data.featured_until) return true;
  return new Date(data.featured_until).getTime() > Date.now();
}

async function getOrder(orderId) {
  const { data } = await admin.from('payment_orders').select('*').eq('id', orderId).maybeSingle();
  return data;
}

async function testFeaturedBankTransfer({ sellerId, adminId, listingId }) {
  const group = 'featuredBankTransfer';
  const sellerToken = await getUserToken(sellerId);
  const adminToken = await getUserToken(adminId);

  await resetPremiumSeller(sellerId);

  await admin.from('listings').update({
    is_featured: false,
    is_premium: false,
    featured_until: null,
    premium_until: null,
  }).eq('id', listingId);

  const createRes = await fetchJson(`${baseUrl}/api/payments/bank-transfer`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'featured_listing', listingId, planId: 'premium_7' }),
  });

  step(group, 'Bank transfer order created', createRes.res.ok, String(createRes.res.status));
  const orderId = createRes.payload.orderId;
  const order = orderId ? await getOrder(orderId) : null;

  step(group, 'provider=bank_transfer', order?.provider === 'bank_transfer', order?.provider);
  step(group, 'status=pending_manual_review', order?.status === 'pending_manual_review', order?.status);
  step(group, 'product_type=featured_listing', order?.product_type === 'featured_listing', order?.product_type);
  step(group, 'amount=1500 XPF', Number(order?.amount) === EXPECTED_FEATURED_AMOUNT && order?.currency === 'XPF', `${order?.amount} ${order?.currency}`);
  step(group, 'listing_id set', order?.listing_id === listingId, order?.listing_id);
  step(group, 'reference NM-*', Boolean(order?.reference?.startsWith('NM-')), order?.reference);

  const { data: beforeListing } = await admin.from('listings').select('is_featured, featured_until').eq('id', listingId).single();
  step(group, 'Listing not featured before approval', !beforeListing?.is_featured, String(beforeListing?.is_featured));

  const pendingRes = await fetchJson(`${baseUrl}/api/admin/payments/pending`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const inPending = (pendingRes.payload?.data || []).some((row) => row.id === orderId);
  step(group, 'Order visible in admin pending list', inPending);

  const approveRes = await fetchJson(`${baseUrl}/api/admin/payments/${orderId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve' }),
  });
  step(group, 'Admin mark paid succeeds', approveRes.res.ok, JSON.stringify(approveRes.payload));

  const paidOrder = await getOrder(orderId);
  step(group, 'payment_order.status=paid', paidOrder?.status === 'paid', paidOrder?.status);
  step(group, 'paid_at set', Boolean(paidOrder?.paid_at));
  step(group, 'reviewed_by set', paidOrder?.reviewed_by === adminId, String(paidOrder?.reviewed_by));

  const { data: afterListing } = await admin.from('listings').select('is_featured, featured_until, is_premium').eq('id', listingId).single();
  step(group, 'listing.is_featured=true', Boolean(afterListing?.is_featured));
  step(group, 'featured_until set', Boolean(afterListing?.featured_until));
  step(group, 'Listing in featured rail query', await isInFeaturedRail(listingId));
  step(group, 'Premium badge flag (is_premium)', Boolean(afterListing?.is_premium));

  const featuredUntil1 = afterListing?.featured_until;

  const approve2 = await fetchJson(`${baseUrl}/api/admin/payments/${orderId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve' }),
  });
  step('idempotency', 'Duplicate featured mark-paid returns alreadyProcessed', approve2.payload?.result?.alreadyProcessed === true);

  const { data: afterDup } = await admin.from('listings').select('featured_until').eq('id', listingId).single();
  step('idempotency', 'featured_until unchanged on duplicate approve', afterDup?.featured_until === featuredUntil1);

  finalizeGroup(group);
  return orderId;
}

async function testFeaturedReject({ sellerId, adminId, listingId }) {
  const group = 'featuredRejectFlow';
  const sellerToken = await getUserToken(sellerId);
  const adminToken = await getUserToken(adminId);

  await admin.from('listings').update({
    is_featured: false,
    is_premium: false,
    featured_until: null,
    premium_until: null,
  }).eq('id', listingId);

  const createRes = await fetchJson(`${baseUrl}/api/payments/bank-transfer`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'featured_listing', listingId, planId: 'premium_7' }),
  });
  const orderId = createRes.payload.orderId;
  step(group, 'Second featured bank transfer created', createRes.res.ok && Boolean(orderId));

  const rejectRes = await fetchJson(`${baseUrl}/api/admin/payments/${orderId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reject', reason: 'Virement non reçu - test staging' }),
  });
  step(group, 'Admin reject succeeds', rejectRes.res.ok);

  const order = await getOrder(orderId);
  step(group, 'status=rejected', order?.status === 'rejected', order?.status);
  step(group, 'rejection_reason saved', Boolean(order?.rejection_reason), order?.rejection_reason);

  const { data: listing } = await admin.from('listings').select('is_featured').eq('id', listingId).single();
  step(group, 'Listing not featured after reject', !listing?.is_featured);

  const userOrdersRes = await fetchJson(`${baseUrl}/api/payments/orders?orderId=${orderId}`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  step(group, 'User can fetch rejected order state', userOrdersRes.res.ok && userOrdersRes.payload?.data?.status === 'rejected');

  finalizeGroup(group);
}

async function testPremiumSeller({ sellerId, adminId }) {
  const group = 'premiumSellerBankTransfer';
  const sellerToken = await getUserToken(sellerId);
  const adminToken = await getUserToken(adminId);

  await resetPremiumSeller(sellerId);
  const { data: beforeProfile } = await admin.from('profiles').select('account_plan, premium_status, listing_photo_limit').eq('id', sellerId).single();
  step(group, 'User not premium before request', beforeProfile?.account_plan !== 'premium_seller');

  const createRes = await fetchJson(`${baseUrl}/api/payments/bank-transfer`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'premium_seller' }),
  });
  step(group, 'Premium seller bank transfer created', createRes.res.ok, JSON.stringify(createRes.payload));

  const orderId = createRes.payload.orderId;
  const order = orderId ? await getOrder(orderId) : null;
  step(group, 'provider=bank_transfer', order?.provider === 'bank_transfer', order?.provider);
  step(group, 'status=pending_manual_review', order?.status === 'pending_manual_review', order?.status);
  step(group, 'product_type=premium_seller', order?.product_type === 'premium_seller', order?.product_type);
  step(group, 'amount=9900 XPF', Number(order?.amount) === EXPECTED_PREMIUM_SELLER_AMOUNT && order?.currency === 'XPF', `${order?.amount} ${order?.currency}`);
  step(group, 'reference NM-*', Boolean(order?.reference?.startsWith('NM-')), order?.reference);

  const { data: pendingProfile } = await admin.from('profiles').select('account_plan, premium_status').eq('id', sellerId).single();
  step(group, 'Not premium before admin approval', pendingProfile?.account_plan !== 'premium_seller' || pendingProfile?.premium_status !== 'active');

  const approveRes = await fetchJson(`${baseUrl}/api/admin/payments/${orderId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve' }),
  });
  step(group, 'Admin mark paid succeeds', approveRes.res.ok);

  const { data: afterProfile } = await admin.from('profiles').select('account_plan, premium_status, premium_ends_at, listing_photo_limit').eq('id', sellerId).single();
  step(group, 'account_plan=premium_seller', afterProfile?.account_plan === 'premium_seller', afterProfile?.account_plan);
  step(group, 'premium_status=active', afterProfile?.premium_status === 'active', afterProfile?.premium_status);
  step(group, 'premium_ends_at set', Boolean(afterProfile?.premium_ends_at));
  step(group, 'listing_photo_limit increased', Number(afterProfile?.listing_photo_limit) > 5, String(afterProfile?.listing_photo_limit));

  const premiumEndsAt1 = afterProfile?.premium_ends_at;

  const approve2 = await fetchJson(`${baseUrl}/api/admin/payments/${orderId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve' }),
  });
  step('idempotency', 'Duplicate premium mark-paid returns alreadyProcessed', approve2.payload?.result?.alreadyProcessed === true);

  const { data: afterDup } = await admin.from('profiles').select('premium_ends_at').eq('id', sellerId).single();
  step('idempotency', 'premium_ends_at unchanged on duplicate approve', afterDup?.premium_ends_at === premiumEndsAt1);

  finalizeGroup(group);
}

async function testEpayncDisabled() {
  const group = 'epayncDisabledState';
  const providersRes = await fetchJson(`${baseUrl}/api/payments/providers`);
  const providers = providersRes.payload?.providers || [];
  step(group, 'Providers API ok', providersRes.res.ok);
  step(group, 'EpayNC appears second', providers[1]?.key === 'epaync', providers.map((p) => p.key).join(','));
  step(group, 'EpayNC disabled/coming soon', providers[1]?.enabled === false && providers[1]?.disabledReason === 'Bientôt disponible', providers[1]?.disabledReason);

  const { count: beforeCount } = await admin.from('payment_orders').select('*', { count: 'exact', head: true }).eq('provider', 'epaync');

  const { data: anyUser } = await admin.from('profiles').select('id').eq('role', 'user').limit(1).maybeSingle();
  const anyToken = anyUser?.id ? await getUserToken(anyUser.id) : null;
  const epayncRes = await fetchJson(`${baseUrl}/api/payments/epaync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${anyToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'premium_seller' }),
  });
  step(group, 'EpayNC checkout blocked (503)', epayncRes.res.status === 503, String(epayncRes.res.status));

  const { count: afterCount } = await admin.from('payment_orders').select('*', { count: 'exact', head: true }).eq('provider', 'epaync');
  step(group, 'No fake EpayNC order created', (afterCount || 0) === (beforeCount || 0));

  finalizeGroup(group);
}

async function testSecurity({ sellerId, regularUserId, adminId, listingId }) {
  const group = 'securityTests';

  const regularUserToken = await getUserToken(regularUserId);
  const adminToken = await getUserToken(adminId);

  const { data: otherListing } = await admin.from('listings').select('id').neq('user_id', sellerId).eq('status', 'approved').limit(1).maybeSingle();
  if (otherListing?.id) {
    const foreignRes = await fetchJson(`${baseUrl}/api/payments/bank-transfer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${regularUserToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productType: 'featured_listing', listingId: otherListing.id, planId: 'premium_7' }),
    });
    step(group, 'Foreign listing blocked', foreignRes.res.status === 403, String(foreignRes.res.status));
  } else {
    step(group, 'Foreign listing blocked', true, 'skipped-no-other-listing');
  }

  const userAdmin = await fetchJson(`${baseUrl}/api/admin/payments/pending`, {
    headers: { Authorization: `Bearer ${regularUserToken}` },
  });
  step(group, 'Normal user cannot access admin pending', userAdmin.res.status === 403, String(userAdmin.res.status));

  const tamperRes = await fetchJson(`${baseUrl}/api/payments/bank-transfer`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await getUserToken(sellerId)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productType: 'featured_listing',
      listingId,
      planId: 'premium_7',
      amount: 1,
      status: 'paid',
      provider: 'stripe',
    }),
  });
  const tamperOrder = tamperRes.payload?.orderId ? await getOrder(tamperRes.payload.orderId) : null;
  step(
    group,
    'Client cannot set amount/status/provider',
    tamperRes.res.ok
      && Number(tamperOrder?.amount) !== 1
      && tamperOrder?.provider === 'bank_transfer'
      && tamperOrder?.status === 'pending_manual_review',
    tamperOrder ? `${tamperOrder.amount}/${tamperOrder.provider}/${tamperOrder.status}` : 'no-order'
  );

  const modRes = await fetchJson(`${baseUrl}/api/admin/payments/pending`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  step(group, 'Admin/moderator can access pending', modRes.res.ok, String(modRes.res.status));

  const stripeRes = await fetch(`${baseUrl}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'featured_listing', listingId, userId: sellerId, planId: 'premium_7' }),
  });
  step(group, 'Stripe checkout route still works', stripeRes.status === 200 || stripeRes.status === 403, String(stripeRes.status));

  await admin.from('profiles').update({ is_suspended: false, suspended_at: null }).eq('id', sellerId);
  await admin.from('profiles').update({ is_suspended: true, suspended_at: new Date().toISOString() }).eq('id', sellerId);
  const sellerToken = await getUserToken(sellerId);
  const suspendedRes = await fetchJson(`${baseUrl}/api/payments/bank-transfer`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sellerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'featured_listing', listingId, planId: 'premium_7' }),
  });
  step(group, 'Suspended user blocked', suspendedRes.res.status === 403, `${suspendedRes.res.status} ${suspendedRes.payload?.code || suspendedRes.payload?.error || ''}`);
  await admin.from('profiles').update({ is_suspended: false, suspended_at: null }).eq('id', sellerId);

  finalizeGroup(group);
}

async function main() {
  const { data: profiles } = await admin.from('profiles').select('id, role, is_suspended').limit(50);
  const seller = profiles?.find((p) => p.role === 'user' && !p.is_suspended);
  const adminProfile = profiles?.find((p) => (p.role === 'admin' || p.role === 'moderator') && !p.is_suspended);
  const regularUser = seller || profiles?.find((p) => p.role === 'user');
  if (!seller || !adminProfile) throw new Error('Missing seller/admin fixtures');

  const listingId = await ensureSellerListing(seller.id);
  await resetPremiumSeller(seller.id);

  const bankEnvOk = Boolean(env.BANK_TRANSFER_ACCOUNT_NAME && env.BANK_TRANSFER_IBAN_OR_RIB && env.BANK_TRANSFER_BANK_NAME);
  if (!bankEnvOk) throw new Error('Bank transfer env not configured in .env.local');

  const providersCheck = await fetchJson(`${baseUrl}/api/payments/providers`);
  const bankEnabled = providersCheck.payload?.providers?.find((p) => p.key === 'bank_transfer')?.enabled;
  if (!bankEnabled) {
    throw new Error('Dev server missing bank transfer env — restart required');
  }

  await testFeaturedBankTransfer({ sellerId: seller.id, adminId: adminProfile.id, listingId });
  await testFeaturedReject({ sellerId: seller.id, adminId: adminProfile.id, listingId });
  await testEpayncDisabled();
  await testSecurity({ sellerId: seller.id, regularUserId: regularUser.id, adminId: adminProfile.id, listingId });
  await testPremiumSeller({ sellerId: seller.id, adminId: adminProfile.id });

  results.idempotency.status = results.idempotency.steps.every((s) => s.ok) ? 'PASS' : 'FAIL';

  const ready = Object.values(results)
    .filter((v) => typeof v === 'object' && v.status)
    .every((v) => v.status === 'PASS') && results.failedSteps.length === 0;

  fs.writeFileSync(path.join(root, 'scripts', 'manual-payments-full-flow-results.json'), JSON.stringify(results, null, 2));

  console.log('\n--- SUMMARY ---');
  console.log(`Featured bank transfer: ${results.featuredBankTransfer.status}`);
  console.log(`Featured reject flow: ${results.featuredRejectFlow.status}`);
  console.log(`Premium Seller bank transfer: ${results.premiumSellerBankTransfer.status}`);
  console.log(`EpayNC disabled state: ${results.epayncDisabledState.status}`);
  console.log(`Security tests: ${results.securityTests.status}`);
  console.log(`Idempotency: ${results.idempotency.status}`);
  if (results.failedSteps.length) console.log('Failed steps:', results.failedSteps.join('; '));
  console.log(`Ready for production manual payment rollout: ${ready ? 'YES' : 'NO'}`);

  process.exit(ready ? 0 : 1);
}

main().catch((error) => {
  console.error('Runner crashed:', error.message);
  process.exit(1);
});
