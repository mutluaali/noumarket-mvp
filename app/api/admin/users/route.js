import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { requireAdmin } from '@/lib/adminAuth';

const userSelect = 'id, full_name, store_name, role, created_at, is_suspended, suspended_at, suspension_reason';

function isMissingSuspensionColumn(error) {
  return /column .* does not exist|Could not find|PGRST204/i.test(error?.message || error?.details || '');
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

    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get('q') || '').trim().toLowerCase();
    const status = searchParams.get('status') || 'all';

    let profileQuery = supabaseAdmin
      .from('profiles')
      .select(userSelect)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status === 'suspended') profileQuery = profileQuery.eq('is_suspended', true);
    if (status === 'active') profileQuery = profileQuery.eq('is_suspended', false);

    let { data: profiles, error } = await profileQuery;
    if (error && isMissingSuspensionColumn(error)) {
      ({ data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, store_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(100));
    }

    if (error) throw error;

    let rows = profiles || [];
    if (query) {
      rows = rows.filter((row) => {
        const haystack = [row.full_name, row.store_name, row.role, row.id].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    const userIds = rows.map((row) => row.id).filter(Boolean);
    if (!userIds.length) {
      return NextResponse.json({ data: [] });
    }

    const [listingsRes, reportsRes] = await Promise.all([
      supabaseAdmin.from('listings').select('user_id').in('user_id', userIds),
      supabaseAdmin.from('listing_reports').select('reporter_id').in('reporter_id', userIds),
    ]);

    const listingCounts = (listingsRes.data || []).reduce((acc, row) => {
      if (!row.user_id) return acc;
      acc[row.user_id] = (acc[row.user_id] || 0) + 1;
      return acc;
    }, {});

    const reportCounts = (reportsRes.data || []).reduce((acc, row) => {
      if (!row.reporter_id) return acc;
      acc[row.reporter_id] = (acc[row.reporter_id] || 0) + 1;
      return acc;
    }, {});

    const data = rows.map((row) => ({
      id: row.id,
      displayName: row.store_name || row.full_name || 'İsimsiz kullanıcı',
      full_name: row.full_name,
      store_name: row.store_name,
      role: row.role || 'user',
      created_at: row.created_at,
      is_suspended: Boolean(row.is_suspended),
      suspended_at: row.suspended_at || null,
      suspension_reason: row.suspension_reason || null,
      listingCount: listingCounts[row.id] || 0,
      reportCount: reportCounts[row.id] || 0,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('api/admin/users GET error:', error);
    return NextResponse.json({ error: error.message || 'Kullanıcılar yüklenemedi.' }, { status: 500 });
  }
}
