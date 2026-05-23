import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_build_placeholder');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function activatePremium({ session }) {
  const listingId = session.metadata?.listing_id;
  const userId = session.metadata?.user_id;
  const premiumDays = Number(session.metadata?.premium_days || 7);

  if (!listingId || !userId) {
    throw new Error('Webhook metadata eksik: listing_id veya user_id yok.');
  }

  await supabaseAdmin
    .from('payment_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      metadata: {
        stripe_payment_intent: session.payment_intent,
        stripe_customer: session.customer,
        premium_days: premiumDays,
      },
    })
    .eq('provider_session_id', session.id);

  const { error: rpcError } = await supabaseAdmin.rpc('activate_listing_premium', {
    target_listing_id: listingId,
    premium_days: premiumDays,
  });

  if (rpcError) {
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + premiumDays);

    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update({
        is_featured: true,
        featured_until: featuredUntil.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    if (updateError) throw updateError;
  }

  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'premium_activated',
    title: 'Premium ilan aktif',
    body: `${premiumDays} günlük premium görünürlük aktif edildi.`,
    metadata: {
      listing_id: listingId,
      stripe_session_id: session.id,
    },
    is_read: false,
  });
}

export async function POST(request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET eksik.' },
      { status: 500 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Stripe webhook signature error:', error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await activatePremium({ session });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook işlenemedi.' },
      { status: 500 }
    );
  }
}
