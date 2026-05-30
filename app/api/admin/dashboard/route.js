import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { requireAdmin } from '@/lib/adminAuth';
import { buildProductInsights, emptyProductInsights, fetchPremiumListingCount } from '@/lib/productMetrics';

function safeCount(rows) {
  return Array.isArray(rows) ? rows.length : 0;
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

    const [listingsRes, reportsRes, paymentsRes, analyticsRes, productInsightsResult, premiumCount] = await Promise.all([
      supabaseAdmin.from('listings').select('id, status, is_featured, is_premium, featured_until, premium_until, view_count, views, created_at, title, category, location, price, currency').order('created_at', { ascending: false }).limit(200),
      supabaseAdmin.from('listing_reports').select('id, listing_id, reporter_id, reason, details, status, created_at').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('payment_orders').select('id, listing_id, user_id, plan, amount, currency, status, provider, provider_session_id, created_at, paid_at').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('analytics_events').select('id, event_name, user_id, session_id, path, properties, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).order('created_at', { ascending: false }).limit(1000),
      buildProductInsights(supabaseAdmin).catch((error) => emptyProductInsights(error.message || 'Ürün metrikleri yüklenemedi.')),
      fetchPremiumListingCount(supabaseAdmin),
    ]);

    const productInsights = productInsightsResult || emptyProductInsights();
    const listings = listingsRes.data || [];
    const reports = reportsRes.data || [];
    const payments = paymentsRes.data || [];
    const analyticsRows = analyticsRes.data || [];
    const paidPayments = payments.filter((payment) => payment.status === 'paid');

    const eventCounts = analyticsRows.reduce((acc, row) => {
      acc[row.event_name] = (acc[row.event_name] || 0) + 1;
      return acc;
    }, {});

    const uniqueSessions = new Set(analyticsRows.map((row) => row.session_id).filter(Boolean)).size;
    const searchMap = analyticsRows
      .filter((row) => row.event_name === 'search')
      .reduce((acc, row) => {
        const query = String(row.properties?.query || '').trim() || 'Boş arama';
        acc[query] = (acc[query] || 0) + 1;
        return acc;
      }, {});

    const topSearches = Object.entries(searchMap)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const analytics = {
      totalEvents: analyticsRows.length,
      uniqueSessions,
      events: eventCounts,
      topSearches,
      lastEvents: analyticsRows.slice(0, 60),
      errors: analyticsRes.error?.message || null,
    };

    const premiumFromSample = listings.filter((item) => item.is_featured || item.is_premium).length;
    const premiumListings = premiumCount.count || premiumFromSample;
    const listingMetrics = productInsights.listings || {};

    const metrics = {
      totalListings: listingMetrics.createdTotal ?? safeCount(listings),
      approvedListings: listingMetrics.approved ?? 0,
      pendingListings: listingMetrics.pending ?? 0,
      rejectedListings: listingMetrics.rejected ?? 0,
      premiumListings,
      openReports: reports.filter((report) => !report.status || report.status === 'open').length,
      users: productInsights.registrations?.total ?? 0,
      revenueXpf: paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      pendingPayments: payments.filter((payment) => payment.status === 'pending').length,
      totalViews: listings.reduce((sum, item) => sum + Number(item.view_count || item.views || 0), 0),
      dailyActiveUsers: productInsights.dailyActiveUsers ?? 0,
    };

    return NextResponse.json({
      metrics,
      productInsights,
      listings,
      reports,
      payments,
      analytics,
      errors: {
        listings: listingsRes.error?.message || null,
        reports: reportsRes.error?.message || null,
        payments: paymentsRes.error?.message || null,
        analytics: analyticsRes.error?.message || null,
        productInsights: productInsights.errors?.length ? productInsights.errors.join('; ') : null,
      },
    });
  } catch (error) {
    console.error('api/admin/dashboard error:', error);
    return NextResponse.json({ error: error.message || 'Genel bakış yüklenemedi.' }, { status: 500 });
  }
}
