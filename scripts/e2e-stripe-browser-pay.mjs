#!/usr/bin/env node
/**
 * Complete Stripe Checkout in headless browser (test card 4242...).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

const EMAIL = 'alimutlu@gmail.com';
const PASSWORD = 'NouE2E-Staging-2026!';
const LISTING_ID = process.argv[3] || '046fa226-614b-42ce-81d8-04d59dc6ddc1';
const USER_ID = '5e18336f-1839-4951-83bd-4d48c4c8e195';
const productType = process.argv[2] || 'featured_listing';
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const app = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const loginRes = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: anon, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const login = await loginRes.json();
if (!login.access_token) throw new Error(`Login failed: ${JSON.stringify(login)}`);

const checkoutBody =
  productType === 'premium_seller'
    ? { productType: 'premium_seller', userId: USER_ID }
    : { productType: 'featured_listing', listingId: LISTING_ID, userId: USER_ID, planId: 'premium_7' };

const checkoutRes = await fetch(`${app}/api/stripe/checkout`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.access_token}` },
  body: JSON.stringify(checkoutBody),
});
const checkout = await checkoutRes.json();
if (!checkout.url) throw new Error(`Checkout failed: ${JSON.stringify(checkout)}`);

console.log('CHECKOUT', { productType, sessionId: checkout.sessionId });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

async function fillStripeCard() {
  const email = page.locator('input#email, input[name="email"], input[autocomplete="email"]').first();
  if (await email.count()) await email.fill(EMAIL);

  let filled = false;
  for (const frame of page.frames()) {
    const number = frame.locator('input[name="number"], input[name="cardnumber"], input[placeholder*="1234"], input[aria-label*="Kart"]');
    if (await number.count()) {
      await number.first().fill('4242424242424242');
      const exp = frame.locator('input[name="exp-date"], input[name="expiry"], input[placeholder*="AA"], input[placeholder*="MM"]');
      const cvc = frame.locator('input[name="cvc"], input[placeholder*="CVC"]');
      if (await exp.count()) await exp.first().fill('1234');
      if (await cvc.count()) await cvc.first().fill('123');
      filled = true;
      break;
    }
  }

  if (!filled) {
    const number = page.locator('input[name="number"], input[placeholder*="1234"]').first();
    if (await number.count()) {
      await number.fill('4242424242424242');
      await page.locator('input[name="exp-date"], input[placeholder*="AA"]').first().fill('1234');
      await page.locator('input[name="cvc"], input[placeholder*="CVC"]').first().fill('123');
      filled = true;
    }
  }

  if (!filled) throw new Error('Card input fields not found');

  const name = page.locator('input#billingName, input[name="billingName"], input[placeholder*="Ad"]').first();
  if (await name.count()) await name.fill('E2E Test User');
}

try {
  await page.goto(checkout.url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('text=Öde, text=Pay, button[type="submit"]', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  await fillStripeCard();

  const payButton = page.locator('button:has-text("Öde"), button:has-text("Pay"), button:has-text("Subscribe"), button.SubmitButton').first();
  await payButton.click({ timeout: 15000 });

  await page.waitForURL(/payment-success|localhost:3000/, { timeout: 120000 });
  const finalUrl = page.url();
  console.log('SUCCESS_URL', finalUrl);

  const sessionMatch = finalUrl.match(/session_id=([^&]+)/);
  console.log('RESULT', JSON.stringify({ productType, sessionId: sessionMatch?.[1] || checkout.sessionId, finalUrl }, null, 2));
} catch (error) {
  const screenshotPath = path.join(root, 'scripts', 'e2e-stripe-error.png');
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  console.error('STRIPE_BROWSER_ERROR', error.message);
  console.error('Screenshot:', screenshotPath);
  process.exitCode = 1;
} finally {
  await browser.close();
}
