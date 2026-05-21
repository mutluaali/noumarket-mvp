import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Stripe webhook verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const listingId = session.metadata?.listing_id;
      const userId = session.metadata?.user_id;
      const premiumDays = Number(session.metadata?.premium_days || 7);

      if (listingId && userId) {
        await supabaseAdmin
          .from('payment_orders')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            provider_payment_id: session.payment_intent || null,
          })
          .eq('provider_session_id', session.id);

        const { error: premiumError } = await supabaseAdmin.rpc('activate_listing_premium', {
          target_listing_id: listingId,
          premium_days: premiumDays,
        });

        if (premiumError) throw premiumError;

        await supabaseAdmin.from('notifications').insert({
          user_id: userId,
          type: 'premium_activated',
          title: 'Premium ilan aktif edildi',
          body: `${premiumDays} günlük premium süren başladı.`,
          metadata: { listing_id: listingId },
          is_read: false,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handling failed:', error);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}
