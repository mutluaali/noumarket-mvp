import { NextResponse } from 'next/server';

export async function POST(request) {
  // Placeholder webhook. Next step: verify Stripe signature, mark payment paid,
  // and call activate_listing_premium(listing_id, premium_days).
  const body = await request.text();
  return NextResponse.json({ ok: true, received: Boolean(body) });
}
