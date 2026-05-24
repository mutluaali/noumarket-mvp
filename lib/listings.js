import { supabase } from './supabase';
import { buildCategoryLabel } from './categorySchema';

function isPremiumActive(row) {
  if (!row.is_featured) return false;
  if (!row.featured_until) return true;
  return new Date(row.featured_until) > new Date();
}

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function calculateTrustScore(row) {
  let score = 40;
  if (row.seller_phone) score += 15;
  if (row.seller_email) score += 10;
  if (row.description && row.description.length > 80) score += 10;
  if (row.image_url || (Array.isArray(row.listing_images) && row.listing_images.length)) score += 15;
  if (row.status === 'approved') score += 10;
  if (row.status === 'rejected') score -= 30;
  return Math.max(0, Math.min(score, 100));
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

  const premiumActive = isPremiumActive(row);
  const categoryId = row.category_id || row.category_slug || '';
  const subcategoryId = row.subcategory_id || row.subcategory_slug || '';
  const categoryLabel = row.category_label || buildCategoryLabel(categoryId, subcategoryId) || row.category || '';

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title ?? '',
    description: row.description ?? '',
    category: row.category ?? categoryLabel,
    categoryId,
    subcategoryId,
    categoryLabel,
    attributes: parseJson(row.attributes, {}),
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
    badge: premiumActive ? 'Premium' : row.status === 'pending' ? 'Onay Bekliyor' : row.status === 'rejected' ? 'Reddedildi' : 'Yeni',
    status: row.status ?? 'pending',
    isFeatured: premiumActive,
    featuredUntil: row.featured_until,
    views: Number(row.view_count || 0),
    trustScore: Number(row.trust_score || calculateTrustScore(row)),
    moderationNote: row.moderation_note || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const listingSelect = '*, listing_images(image_url, sort_order)';

export async function getApprovedListings() {
  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .eq('status', 'approved')
    .order('is_featured', { ascending: false })
    .order('featured_until', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAdminListings() {
  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createListing(payload) {
  const categoryLabel = payload.categoryLabel || buildCategoryLabel(payload.categoryId, payload.subcategoryId) || payload.category;
  const { data, error } = await supabase
    .from('listings')
    .insert({
      user_id: payload.user_id,
      title: payload.title,
      description: payload.description || '',
      category: categoryLabel,
      category_id: payload.categoryId || null,
      subcategory_id: payload.subcategoryId || null,
      category_label: categoryLabel,
      attributes: payload.attributes || {},
      price: payload.price ? Number(payload.price) : null,
      currency: 'XPF',
      location: payload.location,
      seller_name: payload.seller_name || payload.sellerName || '',
      seller_phone: payload.seller_phone || payload.sellerPhone || '',
      seller_email: payload.seller_email || payload.sellerEmail || '',
      image_url: payload.image_url || payload.image || payload.images?.[0] || '',
      status: 'pending',
      is_featured: false,
      featured_until: null,
      trust_score: payload.trustScore || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function writeAuditLog(action, entityId, metadata = {}) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      actor_id: auth?.user?.id || null,
      action,
      entity_type: 'listing',
      entity_id: entityId,
      metadata,
    });
  } catch (error) {
    console.warn('Audit log yazılamadı:', error);
  }
}

export async function approveListing(id) {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'approved', moderation_note: null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  await writeAuditLog('approve_listing', id);
}

export async function rejectListing(id, note = '') {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'rejected', moderation_note: note, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  await writeAuditLog('reject_listing', id, { note });
}

export async function deleteListing(id) {
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
  await writeAuditLog('delete_listing', id);
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
  await writeAuditLog(value ? 'feature_listing' : 'unfeature_listing', id, { days });
}

export async function setPremiumListing(id, days = 7) {
  return toggleFeaturedListing(id, true, days);
}

export async function removePremiumListing(id) {
  return toggleFeaturedListing(id, false);
}
