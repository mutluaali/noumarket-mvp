import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { requireAdmin } from '@/lib/adminAuth';

function isMissingColumn(error) {
  return /column .* does not exist|Could not find|PGRST204/i.test(error?.message || error?.details || '');
}

function sumAmount(rows = []) {
  return rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
}

function isFeaturedActive(listing, now = new Date()) {
  const featured = Boolean(listing?.is_featured || listing?.is_premium);
  if (!featured) return false;
  const until = listing?.featured_until || listing?.premium_until;
  if (!until) return true;
  return new Date(until).getTime() > now.getTime();
}

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

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [paymentsRes, pendingRes, profilesRes, listingsRes] = await Promise.all([
      supabaseAdmin
        .from('payment_orders')
        .select('id, user_id, listing_id, plan, amount, currency, status, product_type, provider, reference, paid_at, created_at')
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(200),
      supabaseAdmin
        .from('payment_orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending_manual_review', 'pending_external_payment']),
      supabaseAdmin
        .from('profiles')
        .select('id, full_name, store_name, account_plan, premium_status, premium_ends_at, stripe_subscription_id')
        .eq('account_plan', 'premium_seller')
        .eq('premium_status', 'active'),
      supabaseAdmin
        .from('listings')
        .select('id, title, user_id, is_featured, is_premium, featured_until, premium_until, status')
        .or('is_featured.eq.true,is_premium.eq.true')
        .limit(500),
    ]);

    if (paymentsRes.error && !isMissingColumn(paymentsRes.error)) throw paymentsRes.error;
    if (pendingRes.error && !isMissingColumn(pendingRes.error)) throw pendingRes.error;
    if (profilesRes.error && !isMissingColumn(profilesRes.error)) throw profilesRes.error;
    if (listingsRes.error && !isMissingColumn(listingsRes.error)) throw listingsRes.error;

    const paidPayments = paymentsRes.data || [];
    const paidThisMonth = paidPayments.filter((row) => row.paid_at && row.paid_at >= monthStart);
    const activePremiumSellers = (profilesRes.data || []).filter((row) => {
      if (!row.premium_ends_at) return true;
      return new Date(row.premium_ends_at).getTime() > now.getTime();
    });
    const activeFeaturedListings = (listingsRes.data || []).filter((row) => isFeaturedActive(row, now));

    const metrics = {
      activePremiumSellers: activePremiumSellers.length,
      activeFeaturedListings: activeFeaturedListings.length,
      revenueThisMonth: sumAmount(paidThisMonth),
      revenueAllTime: sumAmount(paidPayments),
      currency: paidPayments[0]?.currency || 'XPF',
      paidOrdersThisMonth: paidThisMonth.length,
      paidOrdersAllTime: paidPayments.length,
      pendingPayments: pendingRes.count || 0,
    };

    return NextResponse.json({
      metrics,
      recentPayments: paidPayments.slice(0, 30),
      activePremiumSellers: activePremiumSellers.slice(0, 20).map((row) => ({
        id: row.id,
        displayName: row.store_name || row.full_name || 'İsimsiz',
        premiumEndsAt: row.premium_ends_at,
        hasSubscription: Boolean(row.stripe_subscription_id),
      })),
      activeFeaturedListings: activeFeaturedListings.slice(0, 20).map((row) => ({
        id: row.id,
        title: row.title,
        userId: row.user_id,
        featuredUntil: row.featured_until || row.premium_until,
        status: row.status,
      })),
    });
  } catch (error) {
    console.error('api/admin/revenue error:', error);
    return NextResponse.json({ error: error.message || 'Gelir verileri yüklenemedi.' }, { status: 500 });
  }
}
