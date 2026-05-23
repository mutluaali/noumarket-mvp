import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder-service-role-key',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function getAccessToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) return authHeader.slice(7).trim();
  return null;
}

async function requireAdmin(request, supabaseAdmin) {
  const token = getAccessToken(request);
  if (!token) throw new Error('Admin oturumu bulunamadı.');
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user?.id) throw new Error('Admin oturumu doğrulanamadı.');
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', authData.user.id).maybeSingle();
  if (!['admin', 'moderator'].includes(profile?.role)) throw new Error('Admin yetkin yok.');
  return authData.user;
}

export async function PATCH(request, context) {
  try {
    const supabaseAdmin = makeAdminClient();
    const user = await requireAdmin(request, supabaseAdmin);
    const id = context.params.id;
    const body = await request.json().catch(() => ({}));
    const status = body.status || 'resolved';

    if (!['open', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Geçersiz şikayet durumu.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('listing_reports')
      .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('api/admin/reports PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Şikayet güncellenemedi.' }, { status: 500 });
  }
}
