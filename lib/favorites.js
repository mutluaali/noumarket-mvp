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

async function apiJson(path, options = {}) {
  const token = await getAccessToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

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
      throw new Error('Sunucu isteği zaman aşımına uğradı. Sayfayı yenileyip tekrar dene.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function getFavoriteIds(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', userId);

  if (error) throw error;

  return (data || []).map((row) => row.listing_id);
}

export async function getFavoriteListings() {
  const payload = await apiJson('/api/favorites');
  return payload.data || [];
}

export async function addFavorite(userId, listingId) {
  const { error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      listing_id: listingId,
    });

  if (error && !String(error.message).toLowerCase().includes('duplicate')) {
    throw error;
  }
}

export async function removeFavorite(userId, listingId) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId);

  if (error) throw error;
}

export async function toggleFavorite(userId, listingId, isCurrentlyFavorite) {
  if (isCurrentlyFavorite) {
    await removeFavorite(userId, listingId);
    return false;
  }

  await addFavorite(userId, listingId);
  return true;
}
