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
    subcategory: row.subcategory ?? '',
    condition: row.condition ?? 'used',
    metadata: row.metadata ?? {},
    isFeatured: activePremium,
    featuredUntil: row.featured_until,
    views: Number(row.view_count || 0),
    created_at: row.created_at,
  };
}

const listingSelect = '*, listing_images(image_url, sort_order)';

function buildListingsQuery(filters = {}) {
  const params = new URLSearchParams();

  const map = {
    query: filters.query,
    category: filters.category,
    location: filters.location,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
  };

  Object.entries(map).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'Tümü') return;
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `/api/listings?${queryString}` : '/api/listings';
}

export async function getApprovedListings(filters = {}) {
  const response = await fetch(buildListingsQuery(filters), {
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


function safeFileName(name = 'image') {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'image';
}

async function uploadListingImages({ userId, listingId, files = [] }) {
  if (!files.length) return [];

  const uploadedUrls = [];

  for (const [index, file] of files.entries()) {
    const path = `${userId}/${listingId}/${Date.now()}-${index}-${safeFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('listing-images')
      .getPublicUrl(path);

    const publicUrl = publicUrlData?.publicUrl;
    if (publicUrl) uploadedUrls.push(publicUrl);
  }

  return uploadedUrls;
}

export async function createListing(payload) {
  if (!supabase) throw new Error('Supabase bağlantısı yok. .env.local dosyasını kontrol et.');

  const { data, error } = await supabase
    .from('listings')
    .insert({
      user_id: payload.user_id,
      title: payload.title,
      description: payload.description || '',
      category: payload.category,
      subcategory: payload.subcategory || null,
      condition: payload.condition || 'used',
      price: payload.price ? Number(payload.price) : null,
      currency: 'XPF',
      location: payload.location,
      seller_name: payload.seller_name || payload.sellerName || '',
      seller_phone: payload.seller_phone || payload.sellerPhone || '',
      seller_email: payload.seller_email || payload.sellerEmail || '',
      image_url: payload.image_url || payload.image || '',
      metadata: {
        ...(payload.metadata || {}),
        premium_requested: Boolean(payload.premium_requested),
      },
      status: 'pending',
      is_featured: false,
      featured_until: null,
    })
    .select()
    .single();

  if (error) throw error;

  const files = Array.isArray(payload.image_files)
    ? payload.image_files
    : payload.image_file
      ? [payload.image_file]
      : [];

  const uploadedUrls = await uploadListingImages({
    userId: payload.user_id,
    listingId: data.id,
    files,
  });

  if (uploadedUrls.length) {
    const { error: imagesError } = await supabase
      .from('listing_images')
      .insert(uploadedUrls.map((url, index) => ({
        listing_id: data.id,
        image_url: url,
        sort_order: index,
      })));

    if (imagesError) throw imagesError;

    await supabase
      .from('listings')
      .update({ image_url: uploadedUrls[0], updated_at: new Date().toISOString() })
      .eq('id', data.id);
  }

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
