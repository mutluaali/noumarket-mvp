import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_build_placeholder');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

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
    const sessionId = body?.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID gerekli.' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Ödeme tamamlanmamış.' },
        { status: 400 }
      );
    }

    const listingId = session.metadata?.listing_id;
    const premiumDays = Number(session.metadata?.premium_days || 7);

    if (!listingId) {
      return NextResponse.json(
        { error: 'Stripe metadata içinde listing_id yok.' },
        { status: 400 }
      );
    }

    const premiumUntil = new Date(
      Date.now() + premiumDays * 24 * 60 * 60 * 1000
    ).toISOString();

    // Frontend tarafı ilanı premium göstermek için isFeatured kullanıyor.
    // Bu yüzden ödeme sonrası hem is_premium hem is_featured güncelleniyor.
    const { data: updatedListing, error: listingError } = await supabase
      .from('listings')
      .update({
        is_premium: true,
        is_featured: true,
        premium_until: premiumUntil,
      })
      .eq('id', listingId)
      .select('id, is_premium, is_featured, premium_until')
      .single();

    if (listingError) {
      throw listingError;
    }

    const { error: orderError } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
      })
      .eq('provider_session_id', sessionId);

    if (orderError) {
      console.warn('payment_orders güncellenemedi:', orderError.message);
    }

    return NextResponse.json({
      success: true,
      listing: updatedListing,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Ödeme doğrulanamadı.' },
      { status: 500 }
    );
  }
}
