import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { requireAdmin } from '@/lib/adminAuth';
import { fulfillPaymentOrder } from '@/lib/paymentFulfillment';
import { PAYMENT_STATUSES } from '@/lib/paymentProviders';

const PENDING_STATUSES = new Set([
  PAYMENT_STATUSES.PENDING_MANUAL_REVIEW,
  PAYMENT_STATUSES.PENDING_EXTERNAL_PAYMENT,
  PAYMENT_STATUSES.PENDING,
]);

export async function PATCH(request, context) {
  try {
    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabaseAdmin = createServiceRoleClient();
    const auth = await requireAdmin(request, supabaseAdmin);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: orderId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const action = body.action === 'reject' ? 'reject' : 'approve';
    const reason = String(body.reason || '').trim();
    const reviewedAt = new Date().toISOString();

    const { data: order, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return NextResponse.json({ error: 'Ödeme bulunamadı.' }, { status: 404 });

    if (action === 'approve') {
      const result = await fulfillPaymentOrder({ supabase: supabaseAdmin, orderId, source: 'admin_approval' });

      await supabaseAdmin
        .from('payment_orders')
        .update({
          reviewed_by: auth.user.id,
          reviewed_at: reviewedAt,
        })
        .eq('id', orderId);

      return NextResponse.json({ ok: true, result });
    }

    if (order.status === PAYMENT_STATUSES.PAID) {
      return NextResponse.json({ error: 'Onaylanmış bir ödeme reddedilemez.' }, { status: 400 });
    }

    if (!PENDING_STATUSES.has(order.status)) {
      return NextResponse.json({ error: 'Bu ödeme artık reddedilemez.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('payment_orders')
      .update({
        status: PAYMENT_STATUSES.REJECTED,
        reviewed_by: auth.user.id,
        reviewed_at: reviewedAt,
        rejection_reason: reason || 'Ödeme reddedildi.',
        metadata: {
          ...(order.metadata || {}),
          rejected_by_admin: auth.user.id,
        },
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('api/admin/payments/[id] PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Ödeme işlemi başarısız.' }, { status: 500 });
  }
}
