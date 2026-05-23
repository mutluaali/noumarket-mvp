import { supabase } from './supabase';

export async function getSellerReviews(sellerId) {
  if (!sellerId) return [];
  const { data, error } = await supabase
    .from('seller_reviews')
    .select('id,rating,comment,created_at,buyer_id,seller_id')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) {
    console.warn('seller reviews fetch warning:', error);
    return [];
  }
  return data || [];
}

export async function createSellerReview({ sellerId, buyerId, rating, comment }) {
  if (!sellerId || !buyerId) throw new Error('Giriş yapmanız gerekiyor.');
  const safeRating = Math.max(1, Math.min(5, Number(rating || 0)));
  const { data, error } = await supabase
    .from('seller_reviews')
    .upsert({ seller_id: sellerId, buyer_id: buyerId, rating: safeRating, comment: comment || null }, { onConflict: 'seller_id,buyer_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
