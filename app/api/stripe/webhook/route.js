import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getServiceRoleConfigError } from '@/lib/envGuards';
import {
  createSupabaseServiceClient,
  fulfillCheckoutSession,
  logPaymentEvent,
  recordPremiumSellerRenewal,
  syncPremiumSellerSubscription,
} from '@/lib/paymentFulfillment';

export async function POST(request) {
  const configError = getServiceRoleConfigError();
  if (configError) {
    return NextResponse.json({ error: configError.message }, { status: configError.status });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET eksik. Stripe webhook endpoint yapılandırmasını kontrol et.' },
      { status: 500 }
    );
  }

  const supabaseAdmin = createSupabaseServiceClient();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'stripe-signature header eksik.' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Stripe webhook signature failed:', error.message);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  await logPaymentEvent({
    supabase: supabaseAdmin,
    eventId: event.id,
    eventType: event.type,
    sessionId: event.data?.object?.id,
    payload: event,
    status: 'received',
  });

  try {
    let result = null;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      result = await fulfillCheckoutSession({ supabase: supabaseAdmin, session, source: 'stripe_webhook' });
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      await supabaseAdmin
        .from('payment_orders')
        .update({ status: 'expired', metadata: { ...(session.metadata || {}), expired_at: new Date().toISOString() } })
        .eq('provider_session_id', session.id);
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      result = await syncPremiumSellerSubscription({ supabase: supabaseAdmin, subscription, source: event.type });
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      if (invoice.billing_reason === 'subscription_cycle') {
        result = await recordPremiumSellerRenewal({ supabase: supabaseAdmin, invoice, source: 'invoice.paid' });
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      await supabaseAdmin
        .from('payment_orders')
        .update({ status: 'failed', provider_payment_id: paymentIntent.id })
        .eq('provider_payment_id', paymentIntent.id);
    }

    await logPaymentEvent({
      supabase: supabaseAdmin,
      eventId: event.id,
      eventType: event.type,
      sessionId: event.data?.object?.id,
      payload: { result },
      status: 'processed',
    });

    return NextResponse.json({ received: true, result });
  } catch (error) {
    console.error('Stripe webhook handling failed:', error);
    await logPaymentEvent({
      supabase: supabaseAdmin,
      eventId: event.id,
      eventType: event.type,
      sessionId: event.data?.object?.id,
      payload: event,
      status: 'failed',
      errorMessage: error.message,
    });
    return NextResponse.json({ error: error.message || 'Webhook handling failed' }, { status: 500 });
  }
}
