import { NextResponse } from 'next/server';
import { getServiceRoleConfigError } from '@/lib/envGuards';
import { createSupabaseServiceClient } from '@/lib/paymentFulfillment';
import {
  getEpayncConfig,
  isEpayncConfigured,
  isEpayncEnabled,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
} from '@/lib/paymentProviders';
import {
  createManualPaymentOrder,
  resolveAuthenticatedUserId,
  validatePaymentRequest,
} from '@/lib/paymentRequest';
import { isSuspensionError, SUSPENSION_BLOCK_MESSAGE } from '@/lib/suspension';

export async function POST(request) {
  try {
    if (!isEpayncEnabled()) {
      return NextResponse.json({ error: 'EpayNC yakında kullanılabilir olacak.' }, { status: 503 });
    }

    if (!isEpayncConfigured()) {
      return NextResponse.json({ error: 'EpayNC yapılandırması eksik.' }, { status: 503 });
    }

    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabaseAdmin = createSupabaseServiceClient();
    const auth = await resolveAuthenticatedUserId(supabaseAdmin, request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json().catch(() => ({}));
    const productType = body?.productType === 'premium_seller' ? 'premium_seller' : 'featured_listing';

    let validated;
    try {
      validated = await validatePaymentRequest({
        supabaseAdmin,
        userId: auth.userId,
        productType,
        listingId: body?.listingId,
        planId: body?.planId,
      });
    } catch (error) {
      if (isSuspensionError(error)) {
        return NextResponse.json({ error: SUSPENSION_BLOCK_MESSAGE, code: 'USER_SUSPENDED' }, { status: 403 });
      }
      throw error;
    }

    if (validated.error) {
      return NextResponse.json({ error: validated.error }, { status: validated.status });
    }

    const epaync = getEpayncConfig();
    const order = await createManualPaymentOrder({
      supabaseAdmin,
      provider: PAYMENT_PROVIDERS.EPAYNC,
      status: PAYMENT_STATUSES.PENDING_EXTERNAL_PAYMENT,
      userId: auth.userId,
      productType: validated.productType,
      planId: validated.planId,
      amount: validated.amount,
      currency: validated.currency,
      listingId: validated.listingId,
      premiumDays: validated.premiumDays,
      providerReference: epaync.merchantId,
      metadata: {
        listing_title: validated.listingTitle || null,
        epaync_payment_url: epaync.paymentUrl,
      },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      reference: order.reference,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      redirectUrl: epaync.paymentUrl,
    });
  } catch (error) {
    console.error('api/payments/epaync POST error:', error);
    return NextResponse.json({ error: error.message || 'EpayNC ödemesi başlatılamadı.' }, { status: 500 });
  }
}
