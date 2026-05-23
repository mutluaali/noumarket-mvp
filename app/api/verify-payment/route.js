import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServiceClient, fulfillPremiumCheckout } from '@/lib/paymentFulfillment';


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
    const sessionId = body?.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID gerekli.' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const result = await fulfillPremiumCheckout({ supabase: supabaseAdmin, session, source: 'success_page_verify' });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('verify-payment error:', error);
    return NextResponse.json({ error: error.message || 'Ödeme doğrulanamadı.' }, { status: 500 });
  }
}
