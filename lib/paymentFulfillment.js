import { createClient } from '@supabase/supabase-js';

export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder-service-role-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
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

export async function fulfillPremiumCheckout({ supabase, session, source = 'webhook' }) {
  if (!session?.id) {
    throw new Error('Stripe session bulunamadı.');
  }

  if (session.payment_status && session.payment_status !== 'paid') {
    throw new Error('Ödeme henüz paid durumunda değil.');
  }

  const listingId = session.metadata?.listing_id;
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id || session.metadata?.plan || 'premium_7';
  const premiumDays = Number(session.metadata?.premium_days || 7);

  if (!listingId) throw new Error('Stripe metadata içinde listing_id yok.');
  if (!userId) throw new Error('Stripe metadata içinde user_id yok.');

  const { data: order } = await supabase
    .from('payment_orders')
    .select('id, status, listing_id, user_id')
    .eq('provider_session_id', session.id)
    .maybeSingle();

  if (order?.status === 'paid') {
    return { alreadyProcessed: true, listingId, userId, premiumDays, planId };
  }

  const premiumUntil = new Date(Date.now() + premiumDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .update({
      is_premium: true,
      is_featured: true,
      premium_until: premiumUntil,
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .eq('user_id', userId)
    .select('id, title, user_id, is_premium, is_featured, premium_until')
    .single();

  if (listingError) throw listingError;

  const paymentIntent = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || null;

  const { error: orderError } = await supabase
    .from('payment_orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      provider_payment_id: paymentIntent,
      stripe_payment_intent_id: paymentIntent,
      metadata: {
        ...(session.metadata || {}),
        fulfillment_source: source,
        premium_until: premiumUntil,
      },
    })
    .eq('provider_session_id', session.id);

  if (orderError) {
    console.warn('payment_orders güncellenemedi:', orderError.message);
  }

  const { error: notificationError } = await supabase.from('notifications').insert({
    user_id: userId,
    type: 'premium_activated',
    title: 'Premium ilan aktif edildi',
    body: `${premiumDays} günlük premium görünürlük başladı.`,
    metadata: {
      listing_id: listingId,
      plan_id: planId,
      premium_until: premiumUntil,
      stripe_session_id: session.id,
    },
    is_read: false,
  });

  if (notificationError) {
    console.warn('premium notification insert failed:', notificationError.message);
  }

  return {
    alreadyProcessed: false,
    listing,
    listingId,
    userId,
    premiumDays,
    planId,
    premiumUntil,
  };
}
