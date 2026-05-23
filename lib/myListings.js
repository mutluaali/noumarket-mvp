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

    return parsed?.access_token || parsed?.currentSession?.access_token || null;
  } catch (error) {
    console.error('localStorage token read error:', error);
    return null;
  }
}

async function getAccessToken() {
  const localToken = getTokenFromLocalStorage();

  if (localToken) {
    return localToken;
  }

  const sessionResult = await Promise.race([
    supabase.auth.getSession(),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Oturum kontrolü zaman aşımına uğradı. Sayfayı yenileyip tekrar giriş yap.')),
        5000
      )
    ),
  ]);

  if (sessionResult?.error) {
    throw sessionResult.error;
  }

  const token = sessionResult?.data?.session?.access_token;

  if (!token) {
    throw new Error('Oturum bulunamadı. Çıkış yapıp tekrar giriş yap.');
  }

  return token;
}

async function apiJson(path, options = {}) {
  const token = await getAccessToken();

  const response = await Promise.race([
    fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    }),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Sunucu isteği zaman aşımına uğradı. Sayfayı yenileyip tekrar dene.')),
        10000
      )
    ),
  ]);

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'İşlem başarısız.');
  }

  return payload;
}

export async function getMyListings() {
  const payload = await apiJson('/api/my-listings');
  return payload.data || [];
}

export async function deleteMyListing(id) {
  if (!id) throw new Error('Silinecek ilan ID bulunamadı.');
  await apiJson(`/api/my-listings/${id}`, { method: 'DELETE' });
  return true;
}

export async function updateMyListingStatus(id, action) {
  if (!id) throw new Error('İlan ID bulunamadı.');
  if (!action) throw new Error('İşlem tipi bulunamadı.');
  await apiJson(`/api/my-listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
  return true;
}

export async function updateMyListing(payload) {
  const { id, userId } = payload;

  if (!id) throw new Error('Güncellenecek ilan ID bulunamadı.');
  if (!userId) throw new Error('Kullanıcı oturumu bulunamadı.');

  await apiJson(`/api/my-listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      action: 'update',
      title: payload.title,
      description: payload.description || '',
      category: payload.category,
      subcategory: payload.subcategory || '',
      condition: payload.condition || 'used',
      price: payload.price,
      currency: payload.currency || 'XPF',
      location: payload.location,
      seller_name: payload.seller_name || '',
      seller_phone: payload.seller_phone || '',
      seller_email: payload.seller_email || '',
      image_url: payload.image_url || '',
      metadata: payload.metadata || {},
    }),
  });
  return true;
}
