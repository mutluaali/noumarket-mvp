import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getServiceRoleConfigError } from '@/lib/envGuards';
import { createSupabaseServiceClient, fulfillCheckoutSession } from '@/lib/paymentFulfillment';
import { assertUserNotSuspended, isSuspensionError, SUSPENSION_BLOCK_MESSAGE } from '@/lib/suspension';

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
    const sessionId = body?.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: 'Oturum kimliği gerekli.' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const userId = session.metadata?.user_id;
    if (userId) {
      try {
        await assertUserNotSuspended(supabaseAdmin, userId);
      } catch (error) {
        if (isSuspensionError(error)) {
          return NextResponse.json({ error: SUSPENSION_BLOCK_MESSAGE, code: 'USER_SUSPENDED' }, { status: 403 });
        }
        throw error;
      }
    }

    if (session.payment_status && session.payment_status !== 'paid' && session.mode !== 'subscription') {
      return NextResponse.json({ error: 'Ödeme henüz tamamlanmadı.' }, { status: 402 });
    }

    const result = await fulfillCheckoutSession({ supabase: supabaseAdmin, session, source: 'success_page_verify' });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('verify-payment error:', error);
    if (isSuspensionError(error)) {
      return NextResponse.json({ error: SUSPENSION_BLOCK_MESSAGE, code: 'USER_SUSPENDED' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Ödeme doğrulanamadı.' }, { status: 500 });
  }
}
