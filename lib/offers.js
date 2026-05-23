import { supabase } from '@/lib/supabase';

export async function createOffer({ listingId, buyerId, sellerId, amount, message }) {
  if (!listingId || !buyerId || !sellerId) throw new Error('Teklif için ilan, alıcı ve satıcı bilgisi gerekli.');
  const numericAmount = Number(amount || 0);
  if (!numericAmount || numericAmount <= 0) throw new Error('Geçerli bir teklif tutarı gir.');

  const { data, error } = await supabase
    .from('listing_offers')
    .insert({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
      amount: numericAmount,
      message: message || null,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getMyOffers(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('listing_offers')
    .select('*, listings(id,title,price,location,category,images,image_url)')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function updateOfferStatus({ offerId, userId, status }) {
  if (!offerId || !userId) throw new Error('Teklif güncellemesi için yetki bilgisi eksik.');
  if (!['accepted', 'rejected', 'cancelled'].includes(status)) throw new Error('Geçersiz teklif durumu.');

  const { data, error } = await supabase
    .from('listing_offers')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', offerId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
