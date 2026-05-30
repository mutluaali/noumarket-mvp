import { supabase } from './supabase';

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function adminFetch(path, options = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error('Yönetim oturumu bulunamadı.');

  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Yönetim isteği başarısız.');
  return payload;
}

export async function fetchAdminUsers({ query = '', status = 'all' } = {}) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (status && status !== 'all') params.set('status', status);

  const payload = await adminFetch(`/api/admin/users?${params.toString()}`);
  return payload.data || [];
}

export async function suspendAdminUser(userId, reason = '') {
  return adminFetch(`/api/admin/users/${userId}/suspension`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'suspend', reason }),
  });
}

export async function unsuspendAdminUser(userId) {
  return adminFetch(`/api/admin/users/${userId}/suspension`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'unsuspend' }),
  });
}
