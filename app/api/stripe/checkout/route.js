import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLANS = {
  premium_7: { days: 7, amount: 1500, name: 'NouMarket Premium 7 gün' },
  premium_30: { days: 30, amount: 5000, name: 'NouMarket Premium 30 gün' },
};

export async function POST(request) {
  try {
    const { listingId, userId, plan = 'premium_7' } = await request.json();
    const selectedPlan = PLANS[plan];

    if (!listingId || !userId || !selectedPlan) {
      return NextResponse.json({ error: 'Eksik veya hatalı ödeme bilgisi.' }, { status: 400 });
    }

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, title, user_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 });
    }

    if (listing.user_id !== userId) {
      return NextResponse.json({ error: 'Bu ilan için ödeme başlatma yetkin yok.' }, { status: 403 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'xpf',
            product_data: {
              name: selectedPlan.name,
              description: listing.title,
            },
            unit_amount: selectedPlan.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}?payment=success`,
      cancel_url: `${appUrl}?payment=cancelled`,
      metadata: {
        listing_id: listingId,
        user_id: userId,
        premium_days: String(selectedPlan.days),
        plan,
      },
    });

    await supabaseAdmin.from('payment_orders').insert({
      user_id: userId,
      listing_id: listingId,
      provider: 'stripe',
      provider_session_id: session.id,
      plan,
      amount: selectedPlan.amount,
      currency: 'XPF',
      status: 'pending',
      metadata: { premium_days: selectedPlan.days },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Checkout başlatılamadı.' }, { status: 500 });
  }
}
