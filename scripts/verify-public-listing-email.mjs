#!/usr/bin/env node
/**
 * Verify public permalink HTML does not expose seller email.
 * Usage: node scripts/verify-public-listing-email.mjs [baseUrl]
 */
const app = process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function resolveListingId() {
  const listingsRes = await fetch(`${app}/api/listings?page=1&pageSize=1`);
  if (!listingsRes.ok) throw new Error(`listings API ${listingsRes.status}`);
  const payload = await listingsRes.json();
  const id = payload?.data?.[0]?.id;
  if (!id) throw new Error('No approved listing found for email check');
  return id;
}

function analyzeHtml(html) {
  const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const emails = html.match(emailPattern) || [];
  return {
    hasSellerEmailKey: /seller_email/i.test(html),
    hasMailto: /mailto:/i.test(html),
    rawEmails: emails,
  };
}

const listingId = await resolveListingId();
const pageRes = await fetch(`${app}/ilan/${listingId}`, { headers: { 'Cache-Control': 'no-cache' } });
const html = await pageRes.text();
const analysis = analyzeHtml(html);

const pass =
  pageRes.ok &&
  !analysis.hasSellerEmailKey &&
  !analysis.hasMailto &&
  analysis.rawEmails.length === 0;

console.log(
  JSON.stringify(
    {
      appUrl: app,
      listingId,
      pageStatus: pageRes.status,
      ...analysis,
      result: pass ? 'PASS' : 'FAIL',
    },
    null,
    2,
  ),
);

process.exit(pass ? 0 : 1);
