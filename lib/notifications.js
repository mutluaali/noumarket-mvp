import { supabase } from './supabase';

function getTokenFromLocalStorage() {
  if (typeof window === 'undefined') return null;

  try {
    const authKey = Object.keys(window.localStorage).find(
      (key) => key.startsWith('sb-') && key.endsWith('-auth-token')
    );

    if (!authKey) return null;

    const raw = window.localStorage.getItem(authKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token || null;
  } catch {
    return null;
  }
}

async function getAccessToken() {
  const localToken = getTokenFromLocalStorage();
  if (localToken) return localToken;

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const token = data?.session?.access_token;
  if (!token) throw new Error('Oturum bulunamadı. Çıkış yapıp tekrar giriş yap.');

  return token;
}

async function apiJson(path, options = {}, timeoutMs = 6500) {
  const token = await getAccessToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(path, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'İşlem başarısız.');
    }

    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Bildirim isteği zaman aşımına uğradı.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function getNotifications() {
  const payload = await apiJson('/api/notifications', {}, 6500);
  return payload.data || [];
}

export async function getUnreadNotificationCount(userId) {
  if (!userId) return 0;

  try {
    const payload = await apiJson('/api/notifications?mode=count', {}, 4500);
    return Number(payload.unreadCount || 0);
  } catch (error) {
    console.warn('getUnreadNotificationCount fallback:', error);
    return 0;
  }
}

export async function markNotificationRead(id) {
  if (!id) return;
  await apiJson('/api/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function markAllNotificationsRead() {
  await apiJson('/api/notifications/mark-all-read', {
    method: 'POST',
  });
}

export async function deleteNotification(id) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
