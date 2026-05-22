import { supabase } from './supabase';

function premiumIsActive(row) {
  if (!row.is_featured) return false;
  if (!row.featured_until) return true;
  return new Date(row.featured_until).getTime() > Date.now();
}

export function normalizeListing(row) {
  const relatedImages = Array.isArray(row.listing_images)
    ? row.listing_images
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map((image) => image.image_url)
        .filter(Boolean)
    : [];

  const fallbackImage =
    row.image_url ||
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=80';

  const activePremium = premiumIsActive(row);

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title ?? '',
    description: row.description ?? '',
    category: row.category ?? '',
    price: Number(row.price || 0),
    priceText: row.price
      ? `${Number(row.price).toLocaleString('fr-FR')} ${row.currency || 'XPF'}`
      : 'Görüşülür',
    location: row.location ?? '',
    seller: row.seller_name ?? '',
    phone: row.seller_phone ?? '',
    email: row.seller_email ?? '',
    image: relatedImages[0] || fallbackImage,
    images: relatedImages.length ? relatedImages : [fallbackImage],
    badge: activePremium ? 'Premium' : row.status === 'pending' ? 'Onay Bekliyor' : 'Yeni',
    status: row.status ?? 'pending',
    isFeatured: activePremium,
    featuredUntil: row.featured_until,
    views: Number(row.view_count || 0),
    created_at: row.created_at,
  };
}

const listingSelect = '*, listing_images(image_url, sort_order)';

export async function getApprovedListings() {
  const response = await fetch('/api/listings', {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'İlanlar alınamadı');
  }

  return payload.data || [];
}

export async function getAdminListings() {
  const response = await fetch('/api/admin/listings', {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Admin ilanları alınamadı');
  }

  return payload.data || [];
}


export async function createListing(payload) {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      user_id: payload.user_id,
      title: payload.title,
      description: payload.description || '',
      category: payload.category,
      price: payload.price ? Number(payload.price) : null,
      currency: 'XPF',
      location: payload.location,
      seller_name: payload.seller_name || payload.sellerName || '',
      seller_phone: payload.seller_phone || payload.sellerPhone || '',
      seller_email: payload.seller_email || payload.sellerEmail || '',
      image_url: payload.image_url || payload.image || '',
      status: 'pending',
      is_featured: false,
      featured_until: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function approveListing(id) {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function rejectListing(id) {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteListing(id) {
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleFeaturedListing(id, value) {
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + 7);

  const { error } = await supabase
    .from('listings')
    .update({
      is_featured: value,
      featured_until: value ? featuredUntil.toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function setPremiumListing(id, days = 7) {
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + days);

  const { error } = await supabase
    .from('listings')
    .update({
      is_featured: true,
      featured_until: featuredUntil.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function removePremiumListing(id) {
  const { error } = await supabase
    .from('listings')
    .update({
      is_featured: false,
      featured_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}
