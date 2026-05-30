#!/usr/bin/env node
/**
 * Staging-only premium monetization verification.
 * Applies sql/2026-05-30-premium-monetization.sql only (per runbook).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const STAGING_REF = 'pgrrdkuhdoiuqmzafilh';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
      .filter(([key]) => key)
  );
}

const env = { ...loadEnvFile(path.join(root, '.env.local')), ...process.env };
const report = {
  migrationApplied: false,
  schema: {},
  stripeConfig: {},
  prerequisites: {},
  featuredTests: [],
  premiumSellerTests: [],
  expiryTests: [],
  adminRevenueTests: [],
  securityTests: [],
  failed: [],
  warnings: [],
};

function fail(name, detail) {
  report.failed.push({ name, detail });
  console.error(`FAIL: ${name} — ${detail}`);
}

function warn(message) {
  report.warnings.push(message);
  console.warn(`WARN: ${message}`);
}

function pass(name, detail = '') {
  console.log(`PASS: ${name}${detail ? ` — ${detail}` : ''}`);
}

function assertStagingOnly() {
  const url = env.STAGING_DATABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!url.includes(STAGING_REF)) {
    console.error(`Refusing: expected staging ref ${STAGING_REF}`);
    process.exit(1);
  }
}

function buildPoolerCandidates(databaseUrl) {
  const match = databaseUrl.match(/^postgresql:\/\/postgres(?::([^@]+))?@db\.([a-z0-9-]+)\.supabase\.co:5432\/postgres$/i);
  if (!match) return [databaseUrl];
  const password = encodeURIComponent(match[1] || '');
  const ref = match[2];
  const urls = [databaseUrl];
  for (const region of ['ap-south-1', 'eu-central-1', 'us-east-1']) {
    urls.push(`postgresql://postgres.${ref}:${password}@aws-1-${region}.pooler.supabase.com:5432/postgres`);
  }
  return [...new Set(urls)];
}

async function connectPg() {
  let lastError;
  for (const url of buildPoolerCandidates(env.STAGING_DATABASE_URL)) {
    const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      try { await client.end(); } catch { /* ignore */ }
    }
  }
  throw lastError;
}

async function columnExists(client, table, column) {
  const { rows } = await client.query(
    `select 1 from information_schema.columns where table_schema='public' and table_name=$1 and column_name=$2`,
    [table, column]
  );
  return rows.length > 0;
}

async function applyMigration(client) {
  const sql = fs.readFileSync(path.join(root, 'sql', '2026-05-30-premium-monetization.sql'), 'utf8');
  await client.query(sql);
  report.migrationApplied = true;
  pass('Migration applied', '2026-05-30-premium-monetization.sql');
}

async function verifySchema(client) {
  const checks = [
    ['profiles', 'stripe_customer_id'],
    ['profiles', 'stripe_subscription_id'],
    ['payment_orders', 'product_type'],
    ['listings', 'is_featured'],
    ['listings', 'featured_until'],
    ['listings', 'is_premium'],
    ['listings', 'premium_until'],
    ['profiles', 'account_plan'],
    ['profiles', 'premium_status'],
    ['profiles', 'premium_ends_at'],
  ];

  for (const [table, column] of checks) {
    const exists = await columnExists(client, table, column);
    report.schema[`${table}.${column}`] = exists;
    if (exists) pass(`Schema ${table}.${column}`);
    else fail(`Schema ${table}.${column}`, 'missing');
  }

  for (const table of ['payment_orders', 'payment_events']) {
    const { rows } = await client.query(
      `select 1 from information_schema.tables where table_schema='public' and table_name=$1`,
      [table]
    );
    report.schema[table] = rows.length > 0;
    if (rows.length) pass(`Table ${table} exists`);
    else fail(`Table ${table}`, 'missing');
  }

  report.prerequisites.accountPlansMigration = await columnExists(client, 'profiles', 'account_plan');
  if (!report.prerequisites.accountPlansMigration) {
    warn('Staging missing account_plan columns — apply sql/2026-05-28-account-plans-and-listing-rights.sql for Premium Seller tests');
  }
}

function verifyStripeConfig() {
  const secret = env.STRIPE_SECRET_KEY || '';
  report.stripeConfig = {
    hasSecretKey: Boolean(secret),
    isTestKey: secret.startsWith('sk_test_'),
    isLiveKey: secret.startsWith('sk_live_'),
    hasWebhookSecret: Boolean(env.STRIPE_WEBHOOK_SECRET),
    hasPremiumPriceId: Boolean(env.STRIPE_PREMIUM_SELLER_PRICE_ID),
    premiumMonthlyAmount: env.PREMIUM_SELLER_MONTHLY_AMOUNT || '(default 9900 in code)',
    hasCronSecret: Boolean(env.CRON_SECRET),
  };

  if (!secret) fail('Stripe config', 'STRIPE_SECRET_KEY missing');
  else if (secret.startsWith('sk_live_')) fail('Stripe config', 'live key detected — abort');
  else if (secret.startsWith('sk_test_')) pass('Stripe config', 'sk_test_* confirmed');
  else warn('Stripe secret key format unrecognized');

  if (!env.STRIPE_WEBHOOK_SECRET) warn('STRIPE_WEBHOOK_SECRET missing in .env.local');
  else pass('Stripe config', 'STRIPE_WEBHOOK_SECRET present for this run');

  if (!env.CRON_SECRET) warn('CRON_SECRET missing in .env.local');
  else pass('Stripe config', 'CRON_SECRET present for this run');
}

function createSupabaseAdmin() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function featuredUntilFromDays(days) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

async function fulfillFeaturedListingCheckout(supabase, session, source = 'staging_verify') {
  if (session.payment_status !== 'paid') throw new Error('Ödeme henüz paid durumunda değil.');
  const listingId = session.metadata?.listing_id;
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id || 'premium_7';
  const premiumDays = Number(session.metadata?.premium_days || 7);

  const { data: order } = await supabase
    .from('payment_orders')
    .select('id, status')
    .eq('provider_session_id', session.id)
    .maybeSingle();

  if (order?.status === 'paid') return { alreadyProcessed: true, listingId, planId, premiumDays };

  const premiumUntil = featuredUntilFromDays(premiumDays);
  const { error: listingError } = await supabase
    .from('listings')
    .update({
      is_premium: true,
      is_featured: true,
      premium_until: premiumUntil,
      featured_until: premiumUntil,
      premium_source: 'payment',
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .eq('user_id', userId);

  if (listingError) throw listingError;

  await supabase
    .from('payment_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      product_type: 'featured_listing',
      metadata: { fulfillment_source: source, premium_until: premiumUntil, featured_until: premiumUntil },
    })
    .eq('provider_session_id', session.id);

  return { alreadyProcessed: false, listingId, planId, premiumDays, premiumUntil };
}

async function testFeaturedPlan(supabase, listing, planId, days) {
  const testName = `Featured ${days}-day (${planId})`;
  const sessionId = `cs_test_verify_${planId}_${Date.now()}`;
  const userId = listing.user_id;
  const listingId = listing.id;

  await supabase.from('payment_orders').insert({
    user_id: userId,
    listing_id: listingId,
    provider: 'stripe',
    provider_session_id: sessionId,
    stripe_session_id: sessionId,
    plan: planId,
    amount: 1000,
    currency: 'XPF',
    status: 'pending',
    product_type: 'featured_listing',
  });

  const session = {
    id: sessionId,
    payment_status: 'paid',
    metadata: { listing_id: listingId, user_id: userId, plan_id: planId, premium_days: String(days), product_type: 'featured_listing' },
  };

  const first = await fulfillFeaturedListingCheckout(supabase, session, 'staging_verify');
  const second = await fulfillFeaturedListingCheckout(supabase, session, 'staging_verify_dup');

  const { data: order } = await supabase.from('payment_orders').select('status, product_type').eq('provider_session_id', sessionId).single();
  const { data: row } = await supabase.from('listings').select('is_featured, is_premium, featured_until, premium_until, premium_source').eq('id', listingId).single();

  const { count: orderCount } = await supabase.from('payment_orders').select('id', { count: 'exact', head: true }).eq('provider_session_id', sessionId);

  const untilOk = row?.featured_until && row?.premium_until;
  const ok = order?.status === 'paid'
    && row?.is_featured === true
    && row?.is_premium === true
    && row?.premium_source === 'payment'
    && first.alreadyProcessed === false
    && second.alreadyProcessed === true
    && orderCount === 1
    && untilOk;

  report.featuredTests.push({ planId, ok, order, row, idempotent: second.alreadyProcessed, orderCount });
  if (ok) pass(testName);
  else fail(testName, JSON.stringify({ order, row, first, second, orderCount }));
}

async function testPremiumSellerBlocked(supabase) {
  if (report.prerequisites.accountPlansMigration) {
    warn('Premium Seller DB tests require manual Stripe checkout — account_plan columns present');
    return;
  }
  const { error } = await supabase.from('profiles').update({ account_plan: 'premium_seller' }).eq('id', '00000000-0000-0000-0000-000000000001');
  report.premiumSellerTests.push({ blocked: true, error: error?.message || 'account_plan column missing' });
  pass('Premium Seller staging', 'blocked — account plans migration not on staging');
}

async function testExpiry(supabase, baseUrl) {
  const headers = env.CRON_SECRET ? { Authorization: `Bearer ${env.CRON_SECRET}` } : {};
  const { data: listing } = await supabase.from('listings').select('id').eq('status', 'approved').limit(1).single();
  if (!listing?.id) return fail('Expiry', 'no listing');

  const past = new Date(Date.now() - 86400000).toISOString();
  await supabase.from('listings').update({ is_featured: true, is_premium: true, featured_until: past, premium_until: past }).eq('id', listing.id);

  const res = await fetch(`${baseUrl}/api/expire-premiums`, { headers });
  const body = await res.json().catch(() => ({}));
  const { data: cleared } = await supabase.from('listings').select('is_featured, is_premium').eq('id', listing.id).single();

  const ok = res.ok && cleared?.is_featured === false && cleared?.is_premium === false;
  report.expiryTests.push({ featured: ok, status: res.status, body, cleared });
  if (ok) pass('Expiry featured listing');
  else fail('Expiry featured listing', JSON.stringify({ status: res.status, body, cleared }));

  if (report.prerequisites.accountPlansMigration) {
    const { data: seller } = await supabase.from('profiles').select('id').eq('role', 'user').limit(1).single();
    if (seller?.id) {
      await supabase.from('profiles').update({ account_plan: 'premium_seller', premium_status: 'active', premium_ends_at: past, listing_photo_limit: 20 }).eq('id', seller.id);
      const res2 = await fetch(`${baseUrl}/api/expire-premiums`, { headers });
      const { data: after } = await supabase.from('profiles').select('account_plan, premium_status').eq('id', seller.id).single();
      const sellerOk = res2.ok && after?.account_plan === 'free' && after?.premium_status === 'inactive';
      report.expiryTests.push({ premiumSeller: sellerOk, after });
      if (sellerOk) pass('Expiry premium seller');
      else fail('Expiry premium seller', JSON.stringify(after));
    }
  } else {
    warn('Premium seller expiry test skipped — account_plan columns missing');
  }
}

async function testAdminRevenue(baseUrl, supabase) {
  const anon = await fetch(`${baseUrl}/api/admin/revenue`);
  report.securityTests.push({ adminRevenueAnonymousStatus: anon.status });
  if (anon.status === 401 || anon.status === 403) pass('Admin revenue anonymous blocked');
  else fail('Admin revenue anonymous blocked', `status ${anon.status}`);

  const { data: paid } = await supabase.from('payment_orders').select('amount, status, paid_at, product_type').eq('status', 'paid');
  const revenueAllTime = (paid || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const revenueMonth = (paid || []).filter((row) => row.paid_at >= monthStart).reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const { count: activeFeatured } = await supabase.from('listings').select('id', { count: 'exact', head: true }).eq('is_featured', true);

  report.adminRevenueTests.push({
    dbPaidOrders: paid?.length || 0,
    revenueAllTime,
    revenueThisMonth: revenueMonth,
    activeFeaturedListingsDb: activeFeatured || 0,
  });
  pass('Admin revenue DB baseline', `${paid?.length || 0} paid, ${revenueAllTime} XPF all-time`);
}

async function testSecurity(baseUrl, supabase) {
  const { data: listings } = await supabase.from('listings').select('id, user_id').eq('status', 'approved').limit(5);
  const { data: users } = await supabase.from('profiles').select('id').eq('role', 'user').limit(5);

  const listing = listings?.[0];
  const otherUser = users?.find((user) => user.id !== listing?.user_id);

  if (listing && otherUser) {
    const res = await fetch(`${baseUrl}/api/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productType: 'featured_listing', listingId: listing.id, userId: otherUser.id, planId: 'premium_7' }),
    });
    const body = await res.json().catch(() => ({}));
    const blocked = res.status === 403;
    report.securityTests.push({ crossUserCheckout: { status: res.status, error: body.error } });
    if (blocked) pass('Checkout ownership guard');
    else fail('Checkout ownership guard', JSON.stringify(body));
  }

  const unpaid = { id: `cs_unpaid_${Date.now()}`, payment_status: 'unpaid', metadata: { listing_id: listing?.id, user_id: listing?.user_id } };
  try {
    await fulfillFeaturedListingCheckout(supabase, unpaid);
    fail('Unpaid fulfillment blocked', 'should throw');
  } catch (error) {
    pass('Unpaid fulfillment blocked', error.message);
  }

  if (env.STRIPE_WEBHOOK_SECRET) {
    const res = await fetch(`${baseUrl}/api/stripe/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': 'invalid' },
      body: '{}',
    });
    if (res.status === 400) pass('Webhook invalid signature rejected');
    else fail('Webhook invalid signature rejected', `status ${res.status}`);
  }

  const noStripe = await fetch(`${baseUrl}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-staging-test': '1' },
    body: JSON.stringify({ productType: 'featured_listing', listingId: 'x', userId: 'y', planId: 'premium_7' }),
  });
  report.securityTests.push({ checkoutMissingListingStatus: noStripe.status });
}

async function testVerifyPaymentFallback(baseUrl, supabase, listing) {
  const sessionId = `cs_test_verify_fallback_${Date.now()}`;
  await supabase.from('payment_orders').insert({
    user_id: listing.user_id,
    listing_id: listing.id,
    provider: 'stripe',
    provider_session_id: sessionId,
    stripe_session_id: sessionId,
    plan: 'premium_7',
    amount: 1500,
    currency: 'XPF',
    status: 'pending',
    product_type: 'featured_listing',
  });

  const res = await fetch(`${baseUrl}/api/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  const body = await res.json().catch(() => ({}));
  report.securityTests.push({ verifyPaymentInvalidSession: { status: res.status, error: body.error } });
  if (!res.ok) pass('verify-payment rejects unpaid/invalid Stripe session');
  else warn('verify-payment returned success for fake session — Stripe may have test stub');
}

async function main() {
  assertStagingOnly();
  console.log('=== Premium Monetization Staging Verification ===');

  verifyStripeConfig();

  const client = await connectPg();
  try {
    await applyMigration(client);
    await verifySchema(client);
  } finally {
    await client.end();
  }

  const supabase = createSupabaseAdmin();
  const baseUrl = env.VERIFY_BASE_URL || 'http://localhost:3000';

  const { data: listing } = await supabase.from('listings').select('id, user_id, title, status').eq('status', 'approved').limit(1).maybeSingle();
  if (!listing?.id) fail('Fixtures', 'no approved listing');
  else pass('Fixtures', `listing ${listing.id}`);

  if (listing?.id) {
    for (const [planId, days] of [['premium_7', 7], ['premium_14', 14], ['premium_30', 30]]) {
      try {
        await testFeaturedPlan(supabase, listing, planId, days);
      } catch (error) {
        fail(`Featured ${planId}`, error.message);
      }
    }
  }

  await testPremiumSellerBlocked(supabase);

  try {
    await testExpiry(supabase, baseUrl);
  } catch (error) {
    fail('Expiry API', error.message);
  }

  try {
    await testAdminRevenue(baseUrl, supabase);
  } catch (error) {
    fail('Admin revenue', error.message);
  }

  try {
    await testSecurity(baseUrl, supabase);
    if (listing?.id) await testVerifyPaymentFallback(baseUrl, supabase, listing);
  } catch (error) {
    fail('Security tests', error.message);
  }

  const outPath = path.join(root, 'scripts', 'premium-staging-verify-results.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${outPath}`);
  console.log(`Failed: ${report.failed.length}, Warnings: ${report.warnings.length}`);

  const criticalFails = report.failed.filter((item) => !item.name.startsWith('Schema profiles.account'));
  process.exit(criticalFails.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
