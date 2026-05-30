import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { requireAdmin } from '@/lib/adminAuth';

const PENDING_STATUSES = ['pending_manual_review', 'pending_external_payment'];

export async function GET(request) {
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

    const { data: orders, error } = await supabaseAdmin
      .from('payment_orders')
      .select('id, reference, provider, status, product_type, plan, amount, currency, user_id, listing_id, created_at, metadata, payment_instructions, provider_reference')
      .in('status', PENDING_STATUSES)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const listingIds = [...new Set((orders || []).map((row) => row.listing_id).filter(Boolean))];
    const userIds = [...new Set((orders || []).map((row) => row.user_id).filter(Boolean))];

    const [listingsRes, profilesRes] = await Promise.all([
      listingIds.length
        ? supabaseAdmin.from('listings').select('id, title').in('id', listingIds)
        : Promise.resolve({ data: [] }),
      userIds.length
        ? supabaseAdmin.from('profiles').select('id, full_name, store_name').in('id', userIds)
        : Promise.resolve({ data: [] }),
    ]);

    const listingMap = new Map((listingsRes.data || []).map((row) => [row.id, row.title]));
    const profileMap = new Map((profilesRes.data || []).map((row) => [row.id, row.store_name || row.full_name || 'Kullanıcı']));

    return NextResponse.json({
      data: (orders || []).map((order) => ({
        ...order,
        listingTitle: order.listing_id ? listingMap.get(order.listing_id) || order.metadata?.listing_title : null,
        userName: profileMap.get(order.user_id) || 'Kullanıcı',
      })),
    });
  } catch (error) {
    console.error('api/admin/payments/pending GET error:', error);
    return NextResponse.json({ error: error.message || 'Bekleyen ödemeler yüklenemedi.' }, { status: 500 });
  }
}
