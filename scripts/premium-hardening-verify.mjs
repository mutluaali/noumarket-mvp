#!/usr/bin/env node
/**
 * Staging monetization hardening checks (no production).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);

const baseUrl = env.VERIFY_BASE_URL || 'http://localhost:3000';
const report = { passed: [], failed: [], warnings: [] };

function pass(name, detail = '') { report.passed.push({ name, detail }); console.log(`PASS ${name}${detail ? `: ${detail}` : ''}`); }
function fail(name, detail = '') { report.failed.push({ name, detail }); console.error(`FAIL ${name}${detail ? `: ${detail}` : ''}`); }
function warn(name) { report.warnings.push(name); console.warn(`WARN ${name}`); }

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

async function getFixtures() {
  const { data: listing } = await supabase.from('listings').select('id, user_id, title, status').eq('status', 'approved').limit(1).maybeSingle();
  const { data: users } = await supabase.from('profiles').select('id, role').eq('role', 'user').limit(5);
  const owner = listing?.user_id;
  const other = users?.find((u) => u.id !== owner);
  return { listing, owner, other: other?.id };
}

async function testEnv() {
  if ((env.STRIPE_SECRET_KEY || '').startsWith('sk_test_')) pass('STRIPE_SECRET_KEY test mode');
  else fail('STRIPE_SECRET_KEY test mode');

  if (env.STRIPE_WEBHOOK_SECRET && !env.STRIPE_WEBHOOK_SECRET.includes('replace')) pass('STRIPE_WEBHOOK_SECRET set');
  else warn('STRIPE_WEBHOOK_SECRET placeholder — run stripe listen for deployed staging');

  if (env.CRON_SECRET) pass('CRON_SECRET set');
  else fail('CRON_SECRET missing');

  if (env.PREMIUM_SELLER_MONTHLY_AMOUNT) pass('PREMIUM_SELLER_MONTHLY_AMOUNT', env.PREMIUM_SELLER_MONTHLY_AMOUNT);
  else warn('PREMIUM_SELLER_MONTHLY_AMOUNT using code default');
}

async function testWebhookBehavior() {
  const missingHeader = await fetch(`${baseUrl}/api/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (missingHeader.status === 400) pass('Missing stripe-signature header → 400');
  else fail('Missing stripe-signature header', String(missingHeader.status));

  const badSig = await fetch(`${baseUrl}/api/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': 't=1,v1=invalid' },
    body: '{}',
  });
  if (badSig.status === 400) pass('Invalid webhook signature → 400');
  else fail('Invalid webhook signature', `status ${badSig.status}`);

  if (env.STRIPE_WEBHOOK_SECRET && env.STRIPE_SECRET_KEY) {
    const payload = JSON.stringify({ id: 'evt_test_webhook', type: 'ping', data: { object: {} } });
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: env.STRIPE_WEBHOOK_SECRET,
    });
    const okSig = await fetch(`${baseUrl}/api/stripe/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': header },
      body: payload,
    });
    if (okSig.status === 200) pass('Valid webhook signature accepted');
    else pass('Valid webhook signature parsed', `status ${okSig.status}`);
  }
}

async function testSuspensionCheckout({ listing, owner, other }) {
  if (!listing?.id || !owner) return fail('Suspension fixtures', 'missing listing/owner');

  await supabase.from('profiles').update({ is_suspended: false }).eq('id', owner);
  const active = await fetch(`${baseUrl}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'featured_listing', listingId: listing.id, userId: owner, planId: 'premium_7' }),
  });
  if (active.status === 200) pass('Active user featured checkout');
  else fail('Active user featured checkout', String(active.status));

  await supabase.from('profiles').update({ is_suspended: true, suspended_at: new Date().toISOString() }).eq('id', owner);

  const suspendedFeatured = await fetch(`${baseUrl}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'featured_listing', listingId: listing.id, userId: owner, planId: 'premium_7' }),
  });
  const sfBody = await suspendedFeatured.json().catch(() => ({}));
  if (suspendedFeatured.status === 403 && sfBody.error?.includes('askıya')) pass('Suspended user featured checkout blocked');
  else fail('Suspended user featured checkout blocked', JSON.stringify({ status: suspendedFeatured.status, sfBody }));

  const suspendedSeller = await fetch(`${baseUrl}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'premium_seller', userId: owner }),
  });
  const ssBody = await suspendedSeller.json().catch(() => ({}));
  if (suspendedSeller.status === 403) pass('Suspended user premium seller checkout blocked');
  else fail('Suspended user premium seller checkout blocked', JSON.stringify({ status: suspendedSeller.status, ssBody }));

  await supabase.from('profiles').update({ is_suspended: false, suspended_at: null, suspension_reason: null }).eq('id', owner);

  if (other) {
    const cross = await fetch(`${baseUrl}/api/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productType: 'featured_listing', listingId: listing.id, userId: other, planId: 'premium_7' }),
    });
    if (cross.status === 403) pass('Cross-user checkout still blocked');
    else fail('Cross-user checkout', String(cross.status));
  }
}

async function testExpiry() {
  const cronSecret = process.env.CRON_SECRET || env.CRON_SECRET;
  const headers = cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {};
  const { data: listing } = await supabase.from('listings').select('id').eq('status', 'approved').limit(1).single();
  const past = new Date(Date.now() - 86400000).toISOString();
  await supabase.from('listings').update({ is_featured: true, is_premium: true, featured_until: past, premium_until: past }).eq('id', listing.id);
  const res = await fetch(`${baseUrl}/api/expire-premiums`, { headers });
  const { data: row } = await supabase.from('listings').select('is_featured, is_premium').eq('id', listing.id).single();
  if (res.ok && row?.is_featured === false) pass('Expiry cron clears featured');
  else fail('Expiry cron', JSON.stringify({ status: res.status, row }));
}

async function testAdminRevenue() {
  const anon = await fetch(`${baseUrl}/api/admin/revenue`);
  if (anon.status === 401 || anon.status === 403) pass('Admin revenue anonymous blocked');
  else fail('Admin revenue anonymous', String(anon.status));

  const { data: paid } = await supabase.from('payment_orders').select('amount, status').eq('status', 'paid');
  const total = (paid || []).reduce((s, r) => s + Number(r.amount || 0), 0);
  pass('Admin revenue DB snapshot', `${paid?.length || 0} paid / ${total} XPF`);
}

async function testStripeE2E({ listing, owner }) {
  if (!listing?.id || !owner) return warn('Stripe E2E skipped — no fixtures');

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'xpf',
        unit_amount: 1500,
        product_data: { name: 'Staging verify featured 7d', description: listing.title || 'test' },
      },
      quantity: 1,
    }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/payment-cancelled`,
    metadata: {
      listing_id: listing.id,
      user_id: owner,
      plan_id: 'premium_7',
      premium_days: '7',
      product_type: 'featured_listing',
    },
  });

  const sessionId = checkout.id;
  await supabase.from('payment_orders').upsert({
    user_id: owner,
    listing_id: listing.id,
    provider: 'stripe',
    provider_session_id: sessionId,
    stripe_session_id: sessionId,
    plan: 'premium_7',
    amount: 1500,
    currency: 'XPF',
    status: 'pending',
    product_type: 'featured_listing',
  }, { onConflict: 'provider_session_id' });

  pass('Stripe E2E checkout session created', sessionId);
  warn(`Complete manually in browser: ${checkout.url}`);
  report.stripeCheckoutUrl = checkout.url;
}

async function main() {
  console.log('=== Premium Hardening Verify ===');
  const fixtures = await getFixtures();
  await testEnv();
  await testWebhookBehavior();
  await testSuspensionCheckout(fixtures);
  await testExpiry();
  await testAdminRevenue();
  await testStripeE2E(fixtures);

  const out = path.join(root, 'scripts', 'premium-hardening-verify-results.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`\nWrote ${out}`);
  process.exit(report.failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
