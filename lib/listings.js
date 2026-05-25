import { supabase } from './supabase';

function isPremiumActive(row) {
  if (!row?.is_featured) return false;
  if (!row.featured_until) return true;
  return new Date(row.featured_until) > new Date();
}

function pickProfile(row) {
  return row?.profiles || row?.profile || row?.seller_profile || null;
}

export function normalizeListing(row) {
  const relatedImages = Array.isArray(row?.listing_images)
    ? row.listing_images
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map((image) => image.image_url)
        .filter(Boolean)
    : [];

  const fallbackImage =
    row?.image_url ||
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=80';

  const profile = pickProfile(row) || {};
  const premiumActive = isPremiumActive(row);
  const sellerName =
    row?.seller_name ||
    row?.sellerName ||
    profile.full_name ||
    profile.name ||
    profile.display_name ||
    profile.email ||
    '';
  const sellerPhone = row?.seller_phone || row?.sellerPhone || profile.phone || profile.phone_number || '';
  const sellerEmail = row?.seller_email || row?.sellerEmail || profile.email || '';

  return {
    id: row?.id,
    user_id: row?.user_id,
    title: row?.title ?? '',
    description: row?.description ?? '',
    category: row?.category ?? '',
    subcategory: row?.subcategory ?? row?.sub_category ?? '',
    brand: row?.brand ?? '',
    price: Number(row?.price || 0),
    priceText: row?.price
      ? `${Number(row.price).toLocaleString('fr-FR')} ${row.currency || 'XPF'}`
      : 'Görüşülür',
    location: row?.location ?? '',
    seller: sellerName,
    seller_name: sellerName,
    sellerName,
    phone: sellerPhone,
    seller_phone: sellerPhone,
    sellerPhone,
    email: sellerEmail,
    seller_email: sellerEmail,
    sellerEmail,
    seller_verified: Boolean(profile.verified || row?.seller_verified || row?.user_id),
    seller_created_at: profile.created_at || row?.created_at,
    profile,
    image: relatedImages[0] || fallbackImage,
    images: relatedImages.length ? relatedImages : [fallbackImage],
    badge: premiumActive ? 'Premium' : row?.status === 'pending' ? 'Onay Bekliyor' : 'Yeni',
    status: row?.status ?? 'pending',
    isFeatured: premiumActive,
    featuredUntil: row?.featured_until,
    views: Number(row?.view_count || row?.views || 0),
    view_count: Number(row?.view_count || row?.views || 0),
    created_at: row?.created_at,
    updated_at: row?.updated_at,
  };
}

// profiles join bazı Supabase projelerinde FK adı farklı olduğu için güvenli select kullanıyoruz.
// Eğer profiles ilişkisi yoksa fallback otomatik olarak düz select'e düşer.
const listingSelectWithProfile = '*, listing_images(image_url, sort_order), profiles:user_id(id, full_name, name, display_name, phone, phone_number, email, verified, created_at)';
const listingSelectBasic = '*, listing_images(image_url, sort_order)';

async function selectListings(queryBuilder) {
  const withProfile = await queryBuilder(listingSelectWithProfile);
  if (!withProfile.error) return withProfile.data || [];

  // İlişki yoksa projeyi kırma. Eski seller_name/seller_phone alanlarından devam et.
  const basic = await queryBuilder(listingSelectBasic);
  if (basic.error) throw basic.error;
  return basic.data || [];
}

export async function getApprovedListings() {
  return selectListings((selectColumns) =>
    supabase
      .from('listings')
      .select(selectColumns)
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
  );
}

export async function getAdminListings() {
  return selectListings((selectColumns) =>
    supabase
      .from('listings')
      .select(selectColumns)
      .order('created_at', { ascending: false })
  );
}

export async function createListing(payload) {
  const fallbackName = payload.seller_name || payload.sellerName || payload.seller || payload.user_name || payload.email || '';
  const imageUrl = payload.image_url || payload.image || (Array.isArray(payload.images) ? payload.images[0] : '') || '';

  const baseInsert = {
    user_id: payload.user_id,
    title: payload.title,
    description: payload.description || '',
    category: payload.category,
    subcategory: payload.subcategory || payload.sub_category || payload.category_label || null,
    price: payload.price ? Number(String(payload.price).replace(/\D/g, '')) : null,
    currency: payload.currency || 'XPF',
    location: payload.location,
    seller_name: fallbackName,
    seller_phone: payload.seller_phone || payload.sellerPhone || payload.phone || '',
    seller_email: payload.seller_email || payload.sellerEmail || payload.email || '',
    image_url: imageUrl,
    status: 'pending',
    is_featured: false,
    featured_until: null,
  };

  const optionalInsert = {
    category_id: payload.category_id || null,
    subcategory_id: payload.subcategory_id || null,
    attributes: payload.attributes || {},
    contact_methods: payload.contact_methods || payload.contactMethods || [],
  };

  async function tryInsert(record) {
    return supabase.from('listings').insert(record).select().single();
  }

  let { data, error } = await tryInsert({ ...baseInsert, ...optionalInsert });

  if (error && /schema cache|column|Could not find/i.test(error.message || '')) {
    ({ data, error } = await tryInsert(baseInsert));
  }

  if (error) throw error;

  const images = Array.isArray(payload.images) ? payload.images.filter(Boolean) : [];
  if (data?.id && images.length > 1) {
    await supabase.from('listing_images').insert(
      images.map((image_url, index) => ({ listing_id: data.id, image_url, sort_order: index }))
    ).then(({ error: imageError }) => {
      if (imageError) console.warn('listing_images insert skipped:', imageError.message);
    });
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

export async function toggleFeaturedListing(id, value, days = 7) {
  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + days);

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
  return toggleFeaturedListing(id, true, days);
}

export async function removePremiumListing(id) {
  return toggleFeaturedListing(id, false);
}
