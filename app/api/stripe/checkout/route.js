import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getPremiumPlan, PREMIUM_PLANS, resolvePlanAmount } from '@/lib/premiumPlans';
import { getPremiumSellerStripePriceId, PREMIUM_SELLER_PLAN } from '@/lib/sellerSubscription';
import { isPremiumSeller } from '@/lib/accountPlans';
import { getServiceRoleConfigError } from '@/lib/envGuards';
import { createSupabaseServiceClient, getAppUrl } from '@/lib/paymentFulfillment';
import { assertUserNotSuspended, isSuspensionError, SUSPENSION_BLOCK_MESSAGE } from '@/lib/suspension';

async function loadProfile(supabaseAdmin, userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, account_plan, premium_status, premium_ends_at, stripe_customer_id, stripe_subscription_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function suspensionResponse() {
  return NextResponse.json({ error: SUSPENSION_BLOCK_MESSAGE, code: 'USER_SUSPENDED' }, { status: 403 });
}

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY eksik. Vercel Environment Variables alanını kontrol et.' }, { status: 500 });
    }

    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabaseAdmin = createSupabaseServiceClient();
    const body = await request.json();
    const productType = body?.productType || (body?.planId === PREMIUM_SELLER_PLAN.id ? 'premium_seller' : 'featured_listing');
    const userId = body?.userId;

    if (!userId) return NextResponse.json({ error: 'userId gerekli. Önce giriş yap.' }, { status: 401 });

    const profile = await loadProfile(supabaseAdmin, userId);
    if (!profile) return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });

    try {
      await assertUserNotSuspended(supabaseAdmin, userId);
    } catch (error) {
      if (isSuspensionError(error)) return suspensionResponse();
      throw error;
    }

    const appUrl = getAppUrl();

    if (productType === 'premium_seller') {
      if (isPremiumSeller(profile) && profile.stripe_subscription_id) {
        return NextResponse.json({ error: 'Premium Satıcı aboneliğin zaten aktif. Yönetmek için faturalandırma portalını kullan.' }, { status: 400 });
      }

      const priceId = getPremiumSellerStripePriceId();
      const lineItem = priceId
        ? { price: priceId, quantity: 1 }
        : {
            price_data: {
              currency: String(PREMIUM_SELLER_PLAN.currency || 'XPF').toLowerCase(),
              unit_amount: PREMIUM_SELLER_PLAN.amount,
              recurring: { interval: 'month' },
              product_data: {
                name: `NouMarket ${PREMIUM_SELLER_PLAN.name}`,
                description: PREMIUM_SELLER_PLAN.description,
              },
            },
            quantity: 1,
          };

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: profile.stripe_customer_id || undefined,
        line_items: [lineItem],
        success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&product=premium_seller`,
        cancel_url: `${appUrl}/payment-cancelled?product=premium_seller`,
        subscription_data: {
          metadata: {
            user_id: userId,
            product_type: 'premium_seller',
            plan_id: PREMIUM_SELLER_PLAN.id,
          },
        },
        metadata: {
          user_id: userId,
          product_type: 'premium_seller',
          plan_id: PREMIUM_SELLER_PLAN.id,
        },
      });

      await supabaseAdmin.from('payment_orders').insert({
        user_id: userId,
        listing_id: null,
        provider: 'stripe',
        provider_session_id: session.id,
        stripe_session_id: session.id,
        plan: PREMIUM_SELLER_PLAN.id,
        amount: PREMIUM_SELLER_PLAN.amount,
        currency: PREMIUM_SELLER_PLAN.currency,
        status: 'pending',
        product_type: 'premium_seller',
        metadata: {
          plan_id: PREMIUM_SELLER_PLAN.id,
          checkout_url_created_at: new Date().toISOString(),
        },
      });

      return NextResponse.json({ url: session.url, sessionId: session.id, productType: 'premium_seller' });
    }

    const listingId = body?.listingId;
    const planId = body?.planId || body?.plan || 'premium_7';
    const plan = PREMIUM_PLANS[planId] ? getPremiumPlan(planId) : null;

    if (!listingId) return NextResponse.json({ error: 'listingId gerekli.' }, { status: 400 });
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

    const amount = resolvePlanAmount(plan, { isPremiumSeller: isPremiumSeller(profile) });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer: profile.stripe_customer_id || undefined,
      line_items: [
        {
          price_data: {
            currency: String(plan.currency || 'XPF').toLowerCase(),
            unit_amount: amount,
            product_data: {
              name: `NouMarket ${plan.name}`,
              description: listing.title || 'NouMarket öne çıkan ilan',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&product=featured_listing`,
      cancel_url: `${appUrl}/payment-cancelled?listing_id=${listingId}`,
      metadata: {
        listing_id: listingId,
        user_id: userId,
        plan_id: plan.id,
        premium_days: String(plan.days),
        product_type: 'featured_listing',
        charged_amount: String(amount),
      },
    });

    await supabaseAdmin.from('payment_orders').insert({
      user_id: userId,
      listing_id: listingId,
      provider: 'stripe',
      provider_session_id: session.id,
      stripe_session_id: session.id,
      plan: plan.id,
      amount,
      currency: plan.currency,
      status: 'pending',
      product_type: 'featured_listing',
      metadata: {
        plan_id: plan.id,
        premium_days: plan.days,
        listing_title: listing.title,
        checkout_url_created_at: new Date().toISOString(),
        premium_seller_discount: isPremiumSeller(profile),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id, productType: 'featured_listing' });
  } catch (error) {
    console.error('stripe checkout error:', error);
    if (isSuspensionError(error)) {
      return NextResponse.json({ error: SUSPENSION_BLOCK_MESSAGE, code: 'USER_SUSPENDED' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Stripe checkout oluşturulamadı.' }, { status: 500 });
  }
}
