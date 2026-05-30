import { stripe } from './stripe';
import { featuredUntilFromDays, getPremiumPlan } from './premiumPlans';
import { buildPremiumSellerProfilePatch, PREMIUM_SELLER_PLAN } from './sellerSubscription';
import { PREMIUM_STATUSES } from './accountPlans';
import { createServiceRoleClient } from './envGuards';

export function createSupabaseServiceClient() {
  return createServiceRoleClient();
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export async function logPaymentEvent({ supabase, eventId, eventType, sessionId, payload, status = 'received', errorMessage = null }) {
  if (!eventId) return;

  const { error } = await supabase.from('payment_events').upsert(
    {
      provider: 'stripe',
      provider_event_id: eventId,
      provider_session_id: sessionId || null,
      event_type: eventType || null,
      status,
      error_message: errorMessage,
      payload: payload || {},
      processed_at: status === 'processed' ? new Date().toISOString() : null,
    },
    { onConflict: 'provider_event_id' }
  );

  if (error && !String(error.message || '').includes('payment_events')) {
    console.warn('payment_events log failed:', error.message);
  }
}

function paymentIntentId(session) {
  if (typeof session?.payment_intent === 'string') return session.payment_intent;
  return session?.payment_intent?.id || null;
}

function subscriptionIdFromSession(session) {
  if (typeof session?.subscription === 'string') return session.subscription;
  return session?.subscription?.id || null;
}

function customerIdFromSession(session) {
  if (typeof session?.customer === 'string') return session.customer;
  return session?.customer?.id || null;
}

async function markOrderPaid({ supabase, sessionId, patch = {} }) {
  const { error } = await supabase
    .from('payment_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      ...patch,
    })
    .eq('provider_session_id', sessionId);

  if (error) {
    console.warn('payment_orders güncellenemedi:', error.message);
  }
}

async function insertNotification({ supabase, userId, type, title, body, metadata = {} }) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    metadata,
    is_read: false,
  });

  if (error) {
    console.warn('notification insert failed:', error.message);
  }
}

export async function fulfillFeaturedListingCheckout({ supabase, session, source = 'webhook' }) {
  if (!session?.id) throw new Error('Stripe session bulunamadı.');
  if (session.payment_status && session.payment_status !== 'paid') {
    throw new Error('Ödeme henüz paid durumunda değil.');
  }

  const listingId = session.metadata?.listing_id;
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id || session.metadata?.plan || 'premium_7';
  const premiumDays = Number(session.metadata?.premium_days || getPremiumPlan(planId).days || 7);

  if (!listingId) throw new Error('Stripe metadata içinde listing_id yok.');
  if (!userId) throw new Error('Stripe metadata içinde user_id yok.');

  const { data: order } = await supabase
    .from('payment_orders')
    .select('id, status, listing_id, user_id')
    .eq('provider_session_id', session.id)
    .maybeSingle();

  if (order?.status === 'paid') {
    return { alreadyProcessed: true, productType: 'featured_listing', listingId, userId, premiumDays, planId };
  }

  const premiumUntil = featuredUntilFromDays(premiumDays);

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .update({
      is_premium: true,
      is_featured: true,
      premium_until: premiumUntil,
      featured_until: premiumUntil,
      premium_source: 'payment',
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .eq('user_id', userId)
    .select('id, title, user_id, is_premium, is_featured, premium_until, featured_until')
    .single();

  if (listingError) throw listingError;

  await markOrderPaid({
    supabase,
    sessionId: session.id,
    patch: {
      provider_payment_id: paymentIntentId(session),
      stripe_payment_intent_id: paymentIntentId(session),
      product_type: 'featured_listing',
      metadata: {
        ...(session.metadata || {}),
        fulfillment_source: source,
        premium_until: premiumUntil,
        featured_until: premiumUntil,
      },
    },
  });

  await insertNotification({
    supabase,
    userId,
    type: 'premium_activated',
    title: 'Öne çıkan ilan aktif',
    body: `${premiumDays} günlük premium görünürlük başladı.`,
    metadata: {
      listing_id: listingId,
      plan_id: planId,
      premium_until: premiumUntil,
      stripe_session_id: session.id,
    },
  });

  return {
    alreadyProcessed: false,
    productType: 'featured_listing',
    listing,
    listingId,
    userId,
    premiumDays,
    planId,
    premiumUntil,
  };
}

export async function fulfillPremiumSellerCheckout({ supabase, session, source = 'webhook' }) {
  if (!session?.id) throw new Error('Stripe session bulunamadı.');

  const userId = session.metadata?.user_id;
  if (!userId) throw new Error('Stripe metadata içinde user_id yok.');

  const { data: order } = await supabase
    .from('payment_orders')
    .select('id, status, user_id')
    .eq('provider_session_id', session.id)
    .maybeSingle();

  if (order?.status === 'paid') {
    return { alreadyProcessed: true, productType: 'premium_seller', userId };
  }

  let subscriptionId = subscriptionIdFromSession(session);
  let customerId = customerIdFromSession(session);
  let periodEnd = null;

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
    periodEnd = subscription.current_period_end;
  }

  const profilePatch = buildPremiumSellerProfilePatch({
    subscriptionId,
    customerId,
    periodEnd,
    status: PREMIUM_STATUSES.ACTIVE,
  });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update(profilePatch)
    .eq('id', userId)
    .select('id, account_plan, premium_status, premium_ends_at, stripe_subscription_id')
    .single();

  if (profileError) throw profileError;

  await markOrderPaid({
    supabase,
    sessionId: session.id,
    patch: {
      provider_payment_id: subscriptionId || paymentIntentId(session),
      product_type: 'premium_seller',
      plan: PREMIUM_SELLER_PLAN.id,
      metadata: {
        ...(session.metadata || {}),
        fulfillment_source: source,
        stripe_subscription_id: subscriptionId,
        premium_ends_at: profilePatch.premium_ends_at,
      },
    },
  });

  await insertNotification({
    supabase,
    userId,
    type: 'premium_seller_activated',
    title: 'Premium Satıcı aktif',
    body: 'Premium Satıcı aboneliğin başladı. Rozet ve limitlerin güncellendi.',
    metadata: {
      plan_id: PREMIUM_SELLER_PLAN.id,
      premium_ends_at: profilePatch.premium_ends_at,
      stripe_session_id: session.id,
      stripe_subscription_id: subscriptionId,
    },
  });

  return {
    alreadyProcessed: false,
    productType: 'premium_seller',
    profile,
    userId,
    subscriptionId,
  };
}

export async function syncPremiumSellerSubscription({ supabase, subscription, source = 'webhook' }) {
  if (!subscription?.id) throw new Error('Stripe subscription bulunamadı.');

  const userId = subscription.metadata?.user_id;
  if (!userId) throw new Error('Subscription metadata içinde user_id yok.');

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  const activeStatuses = new Set(['active', 'trialing']);
  const isActive = activeStatuses.has(subscription.status);
  const status = isActive
    ? PREMIUM_STATUSES.ACTIVE
    : subscription.cancel_at_period_end
      ? PREMIUM_STATUSES.CANCELED
      : PREMIUM_STATUSES.INACTIVE;

  const profilePatch = buildPremiumSellerProfilePatch({
    subscriptionId: subscription.id,
    customerId,
    periodEnd: subscription.current_period_end,
    status: isActive ? PREMIUM_STATUSES.ACTIVE : PREMIUM_STATUSES.INACTIVE,
  });

  if (!isActive) {
    profilePatch.premium_status = subscription.status === 'canceled' ? PREMIUM_STATUSES.CANCELED : PREMIUM_STATUSES.INACTIVE;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(profilePatch)
    .eq('id', userId)
    .select('id, account_plan, premium_status, premium_ends_at, stripe_subscription_id')
    .single();

  if (error) throw error;

  return { profile, userId, subscriptionId: subscription.id, isActive, source };
}

export async function recordPremiumSellerRenewal({ supabase, invoice, source = 'webhook' }) {
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return { skipped: true, reason: 'no_subscription' };

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const syncResult = await syncPremiumSellerSubscription({ supabase, subscription, source });

  const userId = subscription.metadata?.user_id;
  if (!userId) return { skipped: true, reason: 'no_user_id' };

  const amount = Number(invoice.amount_paid || PREMIUM_SELLER_PLAN.amount || 0);
  const currency = String(invoice.currency || 'xpf').toUpperCase();

  await supabase.from('payment_orders').upsert({
    user_id: userId,
    listing_id: null,
    provider: 'stripe',
    provider_session_id: invoice.id,
    stripe_session_id: invoice.id,
    plan: PREMIUM_SELLER_PLAN.id,
    amount,
    currency,
    status: 'paid',
    paid_at: new Date().toISOString(),
    product_type: 'premium_seller',
    metadata: {
      invoice_id: invoice.id,
      subscription_id: subscriptionId,
      billing_reason: invoice.billing_reason,
      fulfillment_source: source,
    },
  }, { onConflict: 'provider_session_id' });

  return { ...syncResult, amount, currency, invoiceId: invoice.id };
}

export async function fulfillCheckoutSession({ supabase, session, source = 'webhook' }) {
  const productType = session.metadata?.product_type || 'featured_listing';

  if (session.mode === 'subscription' || productType === 'premium_seller') {
    if (session.payment_status && !['paid', 'no_payment_required'].includes(session.payment_status)) {
      throw new Error('Abonelik ödemesi henüz tamamlanmadı.');
    }
    return fulfillPremiumSellerCheckout({ supabase, session, source });
  }

  return fulfillFeaturedListingCheckout({ supabase, session, source });
}

async function markOrderPaidById({ supabase, orderId, patch = {} }) {
  const { error } = await supabase
    .from('payment_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      ...patch,
    })
    .eq('id', orderId);

  if (error) {
    console.warn('payment_orders güncellenemedi:', error.message);
  }
}

const CLAIMABLE_ORDER_STATUSES = ['pending_manual_review', 'pending_external_payment', 'pending'];

async function claimOrderForFulfillment({ supabase, orderId, patch = {} }) {
  const { data, error } = await supabase
    .from('payment_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      ...patch,
    })
    .eq('id', orderId)
    .in('status', CLAIMABLE_ORDER_STATUSES)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data;
}

function orderPremiumDays(order) {
  return Number(order?.premium_days || order?.metadata?.premium_days || getPremiumPlan(order?.plan).days || 7);
}

export async function fulfillFeaturedListingFromOrder({ supabase, order, source = 'admin_approval' }) {
  if (!order?.id) throw new Error('payment_order bulunamadı.');

  const listingId = order.listing_id;
  const userId = order.user_id;
  const planId = order.plan || order.metadata?.plan_id || 'premium_7';
  const premiumDays = orderPremiumDays(order);

  if (!listingId) throw new Error('payment_order içinde listing_id yok.');
  if (!userId) throw new Error('payment_order içinde user_id yok.');

  if (order.status === 'paid') {
    return {
      alreadyProcessed: true,
      productType: 'featured_listing',
      listingId,
      userId,
      planId,
    };
  }

  const claimed = await claimOrderForFulfillment({ supabase, orderId: order.id });
  if (!claimed) {
    const { data: latest } = await supabase.from('payment_orders').select('status, listing_id, user_id, plan').eq('id', order.id).maybeSingle();
    if (latest?.status === 'paid') {
      return {
        alreadyProcessed: true,
        productType: 'featured_listing',
        listingId: latest.listing_id,
        userId: latest.user_id,
        planId: latest.plan || planId,
      };
    }
    throw new Error('Bu ödeme artık işlenemez.');
  }

  const premiumUntil = featuredUntilFromDays(premiumDays);

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .update({
      is_premium: true,
      is_featured: true,
      premium_until: premiumUntil,
      featured_until: premiumUntil,
      premium_source: 'payment',
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .eq('user_id', userId)
    .select('id, title, user_id, is_premium, is_featured, premium_until, featured_until')
    .single();

  if (listingError) throw listingError;

  await supabase
    .from('payment_orders')
    .update({
      product_type: 'featured_listing',
      metadata: {
        ...(claimed.metadata || {}),
        fulfillment_source: source,
        premium_until: premiumUntil,
        featured_until: premiumUntil,
        plan_id: planId,
        premium_days: String(premiumDays),
      },
    })
    .eq('id', order.id);

  await insertNotification({
    supabase,
    userId,
    type: 'premium_activated',
    title: 'Öne çıkan ilan aktif',
    body: `${premiumDays} günlük premium görünürlük başladı.`,
    metadata: {
      listing_id: listingId,
      plan_id: planId,
      premium_until: premiumUntil,
      payment_order_id: order.id,
      reference: order.reference,
    },
  });

  return {
    alreadyProcessed: false,
    productType: 'featured_listing',
    listing,
    listingId,
    userId,
    premiumDays,
    planId,
    premiumUntil,
  };
}

export async function fulfillPremiumSellerFromOrder({ supabase, order, source = 'admin_approval' }) {
  if (!order?.id) throw new Error('payment_order bulunamadı.');

  const userId = order.user_id;
  if (!userId) throw new Error('payment_order içinde user_id yok.');

  if (order.status === 'paid') {
    return { alreadyProcessed: true, productType: 'premium_seller', userId };
  }

  const claimed = await claimOrderForFulfillment({ supabase, orderId: order.id });
  if (!claimed) {
    const { data: latest } = await supabase.from('payment_orders').select('status, user_id').eq('id', order.id).maybeSingle();
    if (latest?.status === 'paid') {
      return { alreadyProcessed: true, productType: 'premium_seller', userId: latest.user_id };
    }
    throw new Error('Bu ödeme artık işlenemez.');
  }

  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const profilePatch = buildPremiumSellerProfilePatch({
    subscriptionId: null,
    customerId: null,
    periodEnd,
    status: PREMIUM_STATUSES.ACTIVE,
  });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update(profilePatch)
    .eq('id', userId)
    .select('id, account_plan, premium_status, premium_ends_at, stripe_subscription_id')
    .single();

  if (profileError) throw profileError;

  await supabase
    .from('payment_orders')
    .update({
      product_type: 'premium_seller',
      plan: PREMIUM_SELLER_PLAN.id,
      metadata: {
        ...(claimed.metadata || {}),
        fulfillment_source: source,
        premium_ends_at: profilePatch.premium_ends_at,
      },
    })
    .eq('id', order.id);

  await insertNotification({
    supabase,
    userId,
    type: 'premium_seller_activated',
    title: 'Premium Satıcı aktif',
    body: 'Premium Satıcı aboneliğin başladı. Rozet ve limitlerin güncellendi.',
    metadata: {
      plan_id: PREMIUM_SELLER_PLAN.id,
      premium_ends_at: profilePatch.premium_ends_at,
      payment_order_id: order.id,
      reference: order.reference,
    },
  });

  return {
    alreadyProcessed: false,
    productType: 'premium_seller',
    profile,
    userId,
  };
}

export async function fulfillPaymentOrder({ supabase, orderId, source = 'admin_approval' }) {
  const { data: order, error } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  if (!order) throw new Error('payment_order bulunamadı.');

  if (order.product_type === 'premium_seller') {
    return fulfillPremiumSellerFromOrder({ supabase, order, source });
  }

  return fulfillFeaturedListingFromOrder({ supabase, order, source });
}

/** @deprecated use fulfillCheckoutSession */
export async function fulfillPremiumCheckout(args) {
  return fulfillCheckoutSession(args);
}
