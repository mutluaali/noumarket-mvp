import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function makeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL eksik.');
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY eksik.');
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

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

async function requireAdmin(request, supabaseAdmin) {
  const token = getAccessToken(request);
  if (!token) throw new Error('Admin oturumu bulunamadı.');
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user?.id) throw new Error('Admin oturumu doğrulanamadı.');

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!['admin', 'moderator'].includes(profile?.role)) throw new Error('Admin yetkin yok.');
  return { user: authData.user, profile };
}

function safeCount(rows) {
  return Array.isArray(rows) ? rows.length : 0;
}

export async function GET(request) {
  try {
    const supabaseAdmin = makeAdminClient();
    await requireAdmin(request, supabaseAdmin);

    const [listingsRes, reportsRes, paymentsRes, profilesRes] = await Promise.all([
      supabaseAdmin.from('listings').select('id, status, is_featured, is_premium, featured_until, premium_until, view_count, views, created_at, title, category, location, price, currency').order('created_at', { ascending: false }).limit(200),
      supabaseAdmin.from('listing_reports').select('id, listing_id, reporter_id, reason, details, status, created_at').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('payment_orders').select('id, listing_id, user_id, plan, amount, currency, status, provider, provider_session_id, created_at, paid_at').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('profiles').select('id, role, created_at').limit(500),
    ]);

    const listings = listingsRes.data || [];
    const reports = reportsRes.data || [];
    const payments = paymentsRes.data || [];
    const profiles = profilesRes.data || [];
    const paidPayments = payments.filter((payment) => payment.status === 'paid');

    const metrics = {
      totalListings: safeCount(listings),
      approvedListings: listings.filter((item) => item.status === 'approved').length,
      pendingListings: listings.filter((item) => item.status === 'pending').length,
      rejectedListings: listings.filter((item) => item.status === 'rejected').length,
      premiumListings: listings.filter((item) => item.is_featured || item.is_premium).length,
      openReports: reports.filter((report) => !report.status || report.status === 'open').length,
      users: safeCount(profiles),
      revenueXpf: paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      pendingPayments: payments.filter((payment) => payment.status === 'pending').length,
      totalViews: listings.reduce((sum, item) => sum + Number(item.view_count || item.views || 0), 0),
    };

    return NextResponse.json({
      metrics,
      listings,
      reports,
      payments,
      errors: {
        listings: listingsRes.error?.message || null,
        reports: reportsRes.error?.message || null,
        payments: paymentsRes.error?.message || null,
        profiles: profilesRes.error?.message || null,
      },
    });
  } catch (error) {
    console.error('api/admin/dashboard error:', error);
    return NextResponse.json({ error: error.message || 'Admin dashboard yüklenemedi.' }, { status: 500 });
  }
}
