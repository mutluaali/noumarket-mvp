import { NextResponse } from 'next/server';

export async function POST(request) {
  // Placeholder endpoint. Stripe secret key should only be used server-side.
  // Next step: install stripe package and create Checkout Session here.
  const body = await request.json();
  return NextResponse.json({
    ok: false,
    message: 'Stripe checkout is not connected yet.',
    received: body,
  }, { status: 501 });
}
