import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function getAccessToken(request) {
  const authHeader = request.headers.get('authorization') || '';

  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);

  if (!match) return null;

  try {
    const decoded = decodeURIComponent(match[1]);
    const parsed = JSON.parse(decoded);

    return (
      parsed?.access_token ||
      parsed?.currentSession?.access_token ||
      parsed?.session?.access_token ||
      null
    );
  } catch {
    return null;
  }
}

async function getUserFromRequest(request, supabaseAdmin) {
  const token = getAccessToken(request);

  if (!token) {
    return { user: null, error: 'Oturum token bulunamadı. Çıkış yapıp tekrar giriş yap.' };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user?.id) {
    return { user: null, error: 'Oturum doğrulanamadı. Çıkış yapıp tekrar giriş yap.' };
  }

  return { user: data.user, error: null };
}


export async function POST(request) {
  try {
    const supabaseAdmin = makeAdminClient();
    const { user, error: userError } = await getUserFromRequest(request, supabaseAdmin);

    if (userError) {
      return NextResponse.json({ error: userError }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('api/notifications/mark-all-read error:', error);
    return NextResponse.json(
      { error: error.message || 'Bildirimler güncellenemedi.' },
      { status: 500 }
    );
  }
}
