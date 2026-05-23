import { supabase } from './supabase';

function cleanText(value) {
  return String(value || '').trim();
}

export function buildSavedSearchName(filters = {}) {
  const parts = [];

  if (cleanText(filters.query)) parts.push(`“${cleanText(filters.query)}”`);
  if (filters.category && filters.category !== 'Tümü') parts.push(filters.category);
  if (filters.location && filters.location !== 'Tümü') parts.push(filters.location);
  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice ? `${filters.minPrice} XPF` : '0 XPF';
    const max = filters.maxPrice ? `${filters.maxPrice} XPF` : '∞';
    parts.push(`${min} - ${max}`);
  }

  return parts.length ? parts.join(' · ') : 'Tüm ilanlar';
}

export async function getSavedSearches(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createSavedSearch(userId, filters) {
  if (!userId) throw new Error('Arama kaydetmek için önce giriş yapmalısın.');

  const payload = {
    user_id: userId,
    name: buildSavedSearchName(filters),
    query: cleanText(filters.query),
    category: filters.category || 'Tümü',
    location: filters.location || 'Tümü',
    min_price: filters.minPrice ? Number(filters.minPrice) : null,
    max_price: filters.maxPrice ? Number(filters.maxPrice) : null,
    sort: filters.sort || 'newest',
    notify_new_matches: true,
  };

  const { data, error } = await supabase
    .from('saved_searches')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSavedSearch(id, userId) {
  if (!id || !userId) return;

  const { error } = await supabase
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function updateSavedSearchNotification(id, userId, enabled) {
  if (!id || !userId) return;

  const { data, error } = await supabase
    .from('saved_searches')
    .update({ notify_new_matches: Boolean(enabled), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
