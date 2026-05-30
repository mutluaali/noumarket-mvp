import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getServiceRoleConfigError } from '@/lib/envGuards';
import { createSupabaseServiceClient, getAppUrl } from '@/lib/paymentFulfillment';
import { assertUserNotSuspended, isSuspensionError, SUSPENSION_BLOCK_MESSAGE } from '@/lib/suspension';

function getAccessToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) return authHeader.slice(7).trim();
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token || null;
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY eksik.' }, { status: 500 });
    }

    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabaseAdmin = createSupabaseServiceClient();
    const token = getAccessToken(request);
    if (!token) return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user?.id) {
      return NextResponse.json({ error: 'Oturum doğrulanamadı.' }, { status: 401 });
    }

    const userId = authData.user.id;

    try {
      await assertUserNotSuspended(supabaseAdmin, userId);
    } catch (error) {
      if (isSuspensionError(error)) {
        return NextResponse.json({ error: SUSPENSION_BLOCK_MESSAGE, code: 'USER_SUSPENDED' }, { status: 403 });
      }
      throw error;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Stripe müşteri kaydı bulunamadı.' }, { status: 400 });
    }

    const appUrl = getAppUrl();
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/?billing=return`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error('stripe billing-portal error:', error);
    if (isSuspensionError(error)) {
      return NextResponse.json({ error: SUSPENSION_BLOCK_MESSAGE, code: 'USER_SUSPENDED' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Faturalandırma portalı açılamadı.' }, { status: 500 });
  }
}
