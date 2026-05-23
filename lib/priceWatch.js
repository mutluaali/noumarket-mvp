import { supabase } from './supabase';

export async function isWatchingPrice(userId, listingId) {
  if (!userId || !listingId) return false;
  const { data, error } = await supabase.from('price_watches').select('id').eq('user_id', userId).eq('listing_id', listingId).maybeSingle();
  if (error) return false;
  return Boolean(data?.id);
}

export async function togglePriceWatch({ userId, listingId, currentPrice }) {
  if (!userId || !listingId) throw new Error('Giriş yapmanız gerekiyor.');
  const existing = await isWatchingPrice(userId, listingId);
  if (existing) {
    const { error } = await supabase.from('price_watches').delete().eq('user_id', userId).eq('listing_id', listingId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from('price_watches').insert({ user_id: userId, listing_id: listingId, original_price: currentPrice || null });
  if (error) throw error;
  return true;
}
