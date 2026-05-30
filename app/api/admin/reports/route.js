import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { OPEN_REPORT_STATUSES } from '@/lib/reports';

function getAccessToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) return authHeader.slice(7).trim();
  return null;
}

async function requireAdmin(request, supabaseAdmin) {
  const token = getAccessToken(request);
  if (!token) return { error: 'Yönetim oturumu bulunamadı.', status: 401 };

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user?.id) {
    return { error: 'Yönetim oturumu doğrulanamadı.', status: 401 };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!['admin', 'moderator'].includes(profile?.role)) {
    return { error: 'Yönetim paneline erişim yetkin yok.', status: 403 };
  }

  return { user: authData.user, profile };
}

function enrichReports(reports = [], listings = [], profiles = []) {
  const listingMap = new Map(listings.map((item) => [item.id, item]));
  const profileMap = new Map(profiles.map((item) => [item.id, item]));

  return reports.map((report) => ({
    ...report,
    listingTitle: listingMap.get(report.listing_id)?.title || 'İlan bulunamadı',
    reporterName: profileMap.get(report.reporter_id)?.full_name || 'Anonim kullanıcı',
  }));
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

    const status = request.nextUrl.searchParams.get('status') || 'open';

    let query = supabaseAdmin
      .from('listing_reports')
      .select('id, listing_id, reporter_id, reason, details, status, created_at, reviewed_at, reviewed_by')
      .order('created_at', { ascending: false })
      .limit(100);

    if (status === 'open') {
      query = query.in('status', OPEN_REPORT_STATUSES);
    } else if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: reports, error } = await query;
    if (error) throw error;

    const rows = reports || [];
    const listingIds = [...new Set(rows.map((row) => row.listing_id).filter(Boolean))];
    const reporterIds = [...new Set(rows.map((row) => row.reporter_id).filter(Boolean))];

    const [listingsRes, profilesRes] = await Promise.all([
      listingIds.length
        ? supabaseAdmin.from('listings').select('id, title').in('id', listingIds)
        : Promise.resolve({ data: [] }),
      reporterIds.length
        ? supabaseAdmin.from('profiles').select('id, full_name').in('id', reporterIds)
        : Promise.resolve({ data: [] }),
    ]);

    return NextResponse.json({
      data: enrichReports(rows, listingsRes.data || [], profilesRes.data || []),
    });
  } catch (error) {
    console.error('api/admin/reports GET error:', error);
    return NextResponse.json({ error: error.message || 'Şikayetler yüklenemedi.' }, { status: 500 });
  }
}
