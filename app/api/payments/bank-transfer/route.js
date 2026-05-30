import { NextResponse } from 'next/server';
import { getServiceRoleConfigError } from '@/lib/envGuards';
import { createSupabaseServiceClient } from '@/lib/paymentFulfillment';
import {
  buildBankTransferInstructions,
  isBankTransferConfigured,
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

    if (!isBankTransferConfigured()) {
      return NextResponse.json(
        { error: 'Banka havalesi geçici olarak kullanılamıyor.' },
        { status: 503 }
      );
    }

    const order = await createManualPaymentOrder({
      supabaseAdmin,
      provider: PAYMENT_PROVIDERS.BANK_TRANSFER,
      status: PAYMENT_STATUSES.PENDING_MANUAL_REVIEW,
      userId: auth.userId,
      productType: validated.productType,
      planId: validated.planId,
      amount: validated.amount,
      currency: validated.currency,
      listingId: validated.listingId,
      premiumDays: validated.premiumDays,
      metadata: {
        listing_title: validated.listingTitle || null,
        premium_seller_discount: validated.productType === 'featured_listing'
          ? validated.amount < validated.plan?.amount
          : false,
      },
    });

    const paymentInstructions = buildBankTransferInstructions(order.reference);

    await supabaseAdmin
      .from('payment_orders')
      .update({ payment_instructions: paymentInstructions })
      .eq('id', order.id);

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      reference: order.reference,
      amount: order.amount,
      currency: order.currency,
      productType: order.product_type,
      plan: order.plan,
      status: order.status,
      paymentInstructions,
      redirectUrl: `/payment-pending?orderId=${order.id}`,
    });
  } catch (error) {
    console.error('api/payments/bank-transfer POST error:', error);
    return NextResponse.json({ error: error.message || 'Ödeme talebi oluşturulamadı.' }, { status: 500 });
  }
}
