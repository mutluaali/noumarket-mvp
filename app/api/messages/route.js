import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function makeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder-service-role-key';
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
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

async function getUserFromRequest(request, supabaseAdmin) {
  const token = getAccessToken(request);
  if (!token) return { user: null, error: 'Oturum token bulunamadı. Çıkış yapıp tekrar giriş yap.' };

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) return { user: null, error: 'Oturum doğrulanamadı. Çıkış yapıp tekrar giriş yap.' };

  return { user: data.user, error: null };
}

export async function GET(request) {
  try {
    const supabaseAdmin = makeAdminClient();
    const { user, error: userError } = await getUserFromRequest(request, supabaseAdmin);
    if (userError) return NextResponse.json({ error: userError, data: [] }, { status: 401 });

    const { data: conversations, error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .select('id, listing_id, buyer_id, seller_id, created_at, updated_at, listings(id, title, image_url, price, currency, location)')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })
      .limit(40);

    if (conversationsError) throw conversationsError;
    const rows = conversations || [];
    if (!rows.length) return NextResponse.json({ data: [] });

    const ids = rows.map((item) => item.id).filter(Boolean);
    let messages = [];

    const first = await supabaseAdmin
      .from('messages')
      .select('id, conversation_id, sender_id, body, read_at, is_read, created_at')
      .in('conversation_id', ids)
      .order('created_at', { ascending: false })
      .limit(200);

    if (first.error) {
      const message = String(first.error.message || '');
      if (message.includes('read_at')) {
        const fallback = await supabaseAdmin
          .from('messages')
          .select('id, conversation_id, sender_id, body, is_read, created_at')
          .in('conversation_id', ids)
          .order('created_at', { ascending: false })
          .limit(200);
        if (fallback.error) throw fallback.error;
        messages = fallback.data || [];
      } else {
        throw first.error;
      }
    } else {
      messages = first.data || [];
    }

    const grouped = messages.reduce((acc, message) => {
      if (!acc[message.conversation_id]) acc[message.conversation_id] = [];
      acc[message.conversation_id].push(message);
      return acc;
    }, {});

    const data = rows.map((conversation) => {
      const conversationMessages = grouped[conversation.id] || [];
      const unreadCount = conversationMessages.filter((message) => {
        if (message.sender_id === user.id) return false;
        if (Object.prototype.hasOwnProperty.call(message, 'read_at')) return !message.read_at;
        return !message.is_read;
      }).length;

      return {
        ...conversation,
        last_message: conversationMessages[0] || null,
        unread_count: unreadCount,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('api/messages error:', error);
    return NextResponse.json({ error: error.message || 'Mesajlar yüklenemedi.', data: [] }, { status: 500 });
  }
}
