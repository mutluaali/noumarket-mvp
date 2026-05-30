export function getAccessTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) return authHeader.slice(7).trim();
  return null;
}

export async function requireAdmin(request, supabaseAdmin) {
  const token = getAccessTokenFromRequest(request);
  if (!token) return { error: 'Yönetim oturumu bulunamadı.', status: 401 };

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user?.id) {
    return { error: 'Yönetim oturumu doğrulanamadı.', status: 401 };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, full_name, store_name')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!['admin', 'moderator'].includes(profile?.role)) {
    return { error: 'Yönetim paneline erişim yetkin yok.', status: 403 };
  }

  return { user: authData.user, profile };
}
