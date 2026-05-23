import { supabase } from './supabase';

export async function isFollowingSeller(userId, sellerId) {
  if (!userId || !sellerId) return false;
  const { data, error } = await supabase.from('seller_follows').select('id').eq('user_id', userId).eq('seller_id', sellerId).maybeSingle();
  if (error) return false;
  return Boolean(data?.id);
}

export async function toggleSellerFollow(userId, sellerId) {
  if (!userId || !sellerId) throw new Error('Giriş yapmanız gerekiyor.');
  const existing = await isFollowingSeller(userId, sellerId);
  if (existing) {
    const { error } = await supabase.from('seller_follows').delete().eq('user_id', userId).eq('seller_id', sellerId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from('seller_follows').insert({ user_id: userId, seller_id: sellerId });
  if (error) throw error;
  return true;
}
