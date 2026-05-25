import { supabase } from './supabase';

export async function getAccessToken() {
  if (typeof window !== 'undefined') {
    try {
      const authKey = Object.keys(window.localStorage).find(
        (key) => key.startsWith('sb-') && key.endsWith('-auth-token')
      );
      const raw = authKey ? window.localStorage.getItem(authKey) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token;
        if (token) return token;
      }
    } catch {
      // Supabase SDK fallback below.
    }
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data?.session?.access_token;
  if (!token) throw new Error('Oturum bulunamadı. Çıkış yapıp tekrar giriş yap.');
  return token;
}

export async function apiJson(path, options = {}) {
  const token = await getAccessToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'İşlem başarısız.');
  return payload;
}
