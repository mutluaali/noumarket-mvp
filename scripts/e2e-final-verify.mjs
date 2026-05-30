#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Stripe from 'stripe';
import { chromium } from 'playwright';

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
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = 'alimutlu@gmail.com';
const PASSWORD = 'NouE2E-Staging-2026!';
const ADMIN_EMAIL = 'user-a.x1780012375117@t.local';
const USER_ID = '5e18336f-1839-4951-83bd-4d48c4c8e195';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const report = {};

async function login(email, password) {
  const r = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}

async function adminGet(pathname) {
  const r = await fetch(`${base}${pathname}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  return r.json();
}

// Billing portal
const sellerLogin = await login(EMAIL, PASSWORD);
const portalRes = await fetch(`${app}/api/stripe/billing-portal`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${sellerLogin.access_token}` },
});
const portal = await portalRes.json();
report.billingPortal = { status: portalRes.status, hasUrl: Boolean(portal.url) };

if (portal.url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(portal.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    const title = await page.title();
    report.billingPortal.pageTitle = title;
    report.billingPortal.opened = title.toLowerCase().includes('billing') || (await page.content()).includes('Abonelik');
  } finally {
    await browser.close();
  }
}

// Cancel subscription at period end via Stripe API (mirrors portal cancel)
const profile = (await adminGet(`/rest/v1/profiles?id=eq.${USER_ID}&select=stripe_subscription_id,account_plan,premium_status,premium_ends_at`))[0];
if (profile?.stripe_subscription_id) {
  const before = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
  const updated = await stripe.subscriptions.update(profile.stripe_subscription_id, { cancel_at_period_end: true });
  report.cancellation = {
    beforeStatus: before.status,
    cancelAtPeriodEnd: updated.cancel_at_period_end,
    currentPeriodEnd: updated.current_period_end ? new Date(updated.current_period_end * 1000).toISOString() : null,
  };
  await new Promise((r) => setTimeout(r, 3000));
  const afterProfile = (await adminGet(`/rest/v1/profiles?id=eq.${USER_ID}&select=account_plan,premium_status,premium_ends_at`))[0];
  report.cancellation.afterProfile = afterProfile;
  report.cancellation.behavior = afterProfile.account_plan === 'premium_seller' && afterProfile.premium_status === 'active'
    ? 'end-of-period: premium remains active until period end'
    : JSON.stringify(afterProfile);
}

// Admin revenue API
const adminLogin = await login(ADMIN_EMAIL, PASSWORD);
const revenueRes = await fetch(`${app}/api/admin/revenue`, {
  headers: { Authorization: `Bearer ${adminLogin.access_token}` },
});
report.adminRevenue = { status: revenueRes.status, body: await revenueRes.json() };

const paidOrders = await adminGet('/rest/v1/payment_orders?status=eq.paid&select=amount,product_type,paid_at&order=paid_at.desc&limit=20');
const paidTotal = paidOrders.reduce((s, o) => s + (o.amount || 0), 0);
report.adminRevenue.dbPaidTotal = paidTotal;
report.adminRevenue.dbPaidCount = paidOrders.length;

// Expiry cron
const past = new Date(Date.now() - 86400000).toISOString();
await fetch(`${base}/rest/v1/listings?id=eq.046fa226-614b-42ce-81d8-04d59dc6ddc1`, {
  method: 'PATCH',
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
  body: JSON.stringify({ featured_until: past, is_featured: true, is_premium: true }),
});
const cron1 = await fetch(`${app}/api/expire-premiums`, { headers: { Authorization: `Bearer ${env.CRON_SECRET}` } });
const cron1Body = await cron1.json();
const listingAfterFeatured = (await adminGet('/rest/v1/listings?id=eq.046fa226-614b-42ce-81d8-04d59dc6ddc1&select=is_featured,is_premium,featured_until'))[0];

await fetch(`${base}/rest/v1/profiles?id=eq.${USER_ID}`, {
  method: 'PATCH',
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ premium_ends_at: past }),
});
const cron2 = await fetch(`${app}/api/expire-premiums`, { headers: { Authorization: `Bearer ${env.CRON_SECRET}` } });
const cron2Body = await cron2.json();
const profileAfterExpiry = (await adminGet(`/rest/v1/profiles?id=eq.${USER_ID}&select=account_plan,premium_status,premium_ends_at,listing_photo_limit`))[0];

report.expiry = {
  featuredCron: { status: cron1.status, body: cron1Body, listingAfterFeatured },
  sellerCron: { status: cron2.status, body: cron2Body, profileAfterExpiry },
};

console.log(JSON.stringify(report, null, 2));
