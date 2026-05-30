import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { resolveAuthenticatedUserId } from '@/lib/paymentRequest';

const PENDING_STATUSES = ['pending_manual_review', 'pending_external_payment', 'pending'];

export async function GET(request) {
  try {
    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabaseAdmin = createServiceRoleClient();
    const auth = await resolveAuthenticatedUserId(supabaseAdmin, request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const orderId = request.nextUrl.searchParams.get('orderId');

    let query = supabaseAdmin
      .from('payment_orders')
      .select('id, reference, provider, status, product_type, plan, amount, currency, listing_id, created_at, paid_at, rejection_reason, payment_instructions')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (orderId) {
      query = query.eq('id', orderId);
    } else {
      query = query.in('status', PENDING_STATUSES);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: orderId ? data?.[0] || null : data || [] });
  } catch (error) {
    console.error('api/payments/orders GET error:', error);
    return NextResponse.json({ error: error.message || 'Ödemeler yüklenemedi.' }, { status: 500 });
  }
}
