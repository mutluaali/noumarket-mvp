import { supabase } from './supabase';

const LISTING_QUERY_TIMEOUT_MS = 8000;

function withTimeout(promise, ms = LISTING_QUERY_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('İlan sorgusu zaman aşımına uğradı. Sayfayı yenileyip tekrar dene.'));
      }, ms);
    }),
  ]);
}

function normalizeRows(rows) {
  return (rows || []).map((row) => ({
    ...row,
    listing_images: Array.isArray(row.listing_images) ? row.listing_images : [],
  }));
}

export async function getMyListings(userId) {
  if (!userId) return [];

  // Production'da embedded relationship bazen session/RLS yüzünden takılıyordu.
  // Bu yüzden önce ilanları sade sorguyla alıyoruz.
  const listingsResponse = await withTimeout(
    supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  );

  if (listingsResponse.error) {
    throw listingsResponse.error;
  }

  const listings = listingsResponse.data || [];
  const ids = listings.map((item) => item.id).filter(Boolean);

  if (ids.length === 0) {
    return [];
  }

  // Görseller ayrı sorgulanıyor. Bu sorgu başarısız olursa ilanları yine gösteriyoruz.
  const imagesResponse = await withTimeout(
    supabase
      .from('listing_images')
      .select('listing_id, image_url, sort_order')
      .in('listing_id', ids)
      .order('sort_order', { ascending: true }),
    8000
  ).catch((error) => {
    console.warn('listing_images sorgusu başarısız:', error.message);
    return { data: [], error: null };
  });

  const imagesByListingId = {};

  for (const image of imagesResponse.data || []) {
    if (!imagesByListingId[image.listing_id]) {
      imagesByListingId[image.listing_id] = [];
    }

    imagesByListingId[image.listing_id].push({
      image_url: image.image_url,
      sort_order: image.sort_order,
    });
  }

  return normalizeRows(
    listings.map((listing) => ({
      ...listing,
      listing_images: imagesByListingId[listing.id] || [],
    }))
  );
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
