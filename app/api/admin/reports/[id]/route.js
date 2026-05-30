import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { REPORT_STATUSES } from '@/lib/reports';

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

const ALLOWED_STATUSES = [
  REPORT_STATUSES.OPEN,
  REPORT_STATUSES.REVIEWING,
  REPORT_STATUSES.RESOLVED,
  REPORT_STATUSES.DISMISSED,
];

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

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const status = body.status || REPORT_STATUSES.RESOLVED;

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Geçersiz şikayet durumu.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('listing_reports')
      .update({
        status,
        reviewed_by: auth.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, status, reviewed_at')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Şikayet bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('api/admin/reports PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Şikayet güncellenemedi.' }, { status: 500 });
  }
}
