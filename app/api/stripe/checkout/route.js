import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getPremiumPlan, PREMIUM_PLANS } from '@/lib/premiumPlans';
import { createSupabaseServiceClient, getAppUrl } from '@/lib/paymentFulfillment';


const supabaseAdmin = createSupabaseServiceClient();

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY eksik. Vercel Environment Variables alanını kontrol et.' }, { status: 500 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY eksik. Vercel Environment Variables alanını kontrol et.' }, { status: 500 });
    }

    const body = await request.json();
    const listingId = body?.listingId;
    const userId = body?.userId;
    const planId = body?.planId || body?.plan || 'premium_7';
    const plan = PREMIUM_PLANS[planId] ? getPremiumPlan(planId) : null;

    if (!listingId) return NextResponse.json({ error: 'listingId gerekli.' }, { status: 400 });
    if (!userId) return NextResponse.json({ error: 'userId gerekli. Önce giriş yap.' }, { status: 401 });
    if (!plan) return NextResponse.json({ error: 'Geçersiz premium planı.' }, { status: 400 });

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, title, user_id, status')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'İlan bulunamadı. Listing ID doğru mu kontrol et.' }, { status: 404 });
    }
    if (listing.user_id !== userId) {
      return NextResponse.json({ error: 'Sadece kendi ilanını premium yapabilirsin.' }, { status: 403 });
    }
    if (listing.status && !['approved', 'pending', 'active'].includes(listing.status)) {
      return NextResponse.json({ error: 'Sadece yayındaki veya onay bekleyen ilan premium yapılabilir.' }, { status: 400 });
    }

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: String(plan.currency || 'XPF').toLowerCase(),
            unit_amount: plan.amount,
            product_data: {
              name: `NouMarket ${plan.name}`,
              description: listing.title || 'NouMarket premium ilan yükseltme',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment-cancelled?listing_id=${listingId}`,
      metadata: {
        listing_id: listingId,
        user_id: userId,
        plan_id: plan.id,
        premium_days: String(plan.days),
      },
    });

    await supabaseAdmin.from('payment_orders').insert({
      user_id: userId,
      listing_id: listingId,
      provider: 'stripe',
      provider_session_id: session.id,
      stripe_session_id: session.id,
      plan: plan.id,
      amount: plan.amount,
      currency: plan.currency,
      status: 'pending',
      metadata: {
        plan_id: plan.id,
        premium_days: plan.days,
        listing_title: listing.title,
        checkout_url_created_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('stripe checkout error:', error);
    return NextResponse.json({ error: error.message || 'Stripe checkout oluşturulamadı.' }, { status: 500 });
  }
}
