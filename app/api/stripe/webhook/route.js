import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServiceClient, fulfillPremiumCheckout, logPaymentEvent } from '@/lib/paymentFulfillment';

export const runtime = 'nodejs';

const supabaseAdmin = createSupabaseServiceClient();

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET eksik.' }, { status: 500 });
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
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const result = await fulfillPremiumCheckout({ supabase: supabaseAdmin, session, source: 'stripe_webhook' });

      await logPaymentEvent({
        supabase: supabaseAdmin,
        eventId: event.id,
        eventType: event.type,
        sessionId: session.id,
        payload: { result },
        status: 'processed',
      });
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      await supabaseAdmin
        .from('payment_orders')
        .update({ status: 'expired', metadata: { ...(session.metadata || {}), expired_at: new Date().toISOString() } })
        .eq('provider_session_id', session.id);
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      await supabaseAdmin
        .from('payment_orders')
        .update({ status: 'failed', provider_payment_id: paymentIntent.id })
        .eq('provider_payment_id', paymentIntent.id);
    }

    return NextResponse.json({ received: true });
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
