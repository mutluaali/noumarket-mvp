import { supabase } from './supabase';

const listingSelect = '*, listing_images(image_url, sort_order)';

export async function getMyListings(userId) {
  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteMyListing(id) {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function updateMyListing(payload) {
  const { id, userId } = payload;

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
