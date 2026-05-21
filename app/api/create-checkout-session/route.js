import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const PLANS = {
  premium_7: {
    name: 'NouMarket Öne Çıkan İlan - 7 Gün',
    amount: 1500,
    days: 7,
  },
  premium_30: {
    name: 'NouMarket Öne Çıkan İlan - 30 Gün',
    amount: 5000,
    days: 30,
  },
};

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY eksik. .env.local dosyasını kontrol et.' },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY eksik. .env.local dosyasını kontrol et.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const listingId = body?.listingId;
    const userId = body?.userId;
    const planId = body?.planId || 'premium_7';
    const plan = PLANS[planId];

    if (!listingId) {
      return NextResponse.json({ error: 'listingId gerekli.' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId gerekli. Önce giriş yap.' }, { status: 401 });
    }

    if (!plan) {
      return NextResponse.json({ error: 'Geçersiz premium planı.' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, title, user_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'İlan bulunamadı. Listing ID doğru mu kontrol et.' },
        { status: 404 }
      );
    }

    if (listing.user_id !== userId) {
      return NextResponse.json(
        { error: 'Sadece kendi ilanını premium yapabilirsin.' },
        { status: 403 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'xpf',
            unit_amount: plan.amount,
            product_data: {
              name: plan.name,
              description: listing.title || 'NouMarket ilan premium yükseltme',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}?payment=cancelled`,
      metadata: {
        listing_id: listingId,
        user_id: userId,
        plan_id: planId,
        premium_days: String(plan.days),
      },
    });

    await supabaseAdmin.from('payment_orders').insert({
      user_id: userId,
      listing_id: listingId,
      provider: 'stripe',
      provider_session_id: session.id,
      stripe_session_id: session.id,
      amount: plan.amount,
      currency: 'XPF',
      status: 'pending',
      metadata: {
        plan_id: planId,
        premium_days: plan.days,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Stripe checkout oluşturulamadı.' },
      { status: 500 }
    );
  }
}
