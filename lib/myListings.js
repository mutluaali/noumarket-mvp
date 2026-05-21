import { supabase } from './supabase';

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const token = data?.session?.access_token;

  if (!token) {
    throw new Error('Oturum bulunamadı. Çıkış yapıp tekrar giriş yap.');
  }

  return token;
}

async function apiJson(path, options = {}) {
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

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function updateMyListing(payload) {
  const { id, userId } = payload;

  if (!id) throw new Error('Güncellenecek ilan ID bulunamadı.');
  if (!userId) throw new Error('Kullanıcı oturumu bulunamadı.');

  const { error } = await supabase
    .from('listings')
    .update({
      title: payload.title,
      description: payload.description || '',
      category: payload.category,
      price: payload.price ? Number(payload.price) : null,
      currency: 'XPF',
      location: payload.location,
      seller_name: payload.seller_name || '',
      seller_phone: payload.seller_phone || '',
      seller_email: payload.seller_email || '',
      image_url: payload.image_url || '',
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}
