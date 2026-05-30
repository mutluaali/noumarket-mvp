import { supabase } from './supabase';
import { buildListingBusinessFields, consumeFreeListingQuota, getListingEntitlements } from './accountPlans';
import { validateListingImages } from './uploadGuards';
import { assertUserNotSuspended } from './suspension';
import { sanitizeListingImageFields } from './listingImages';

const LISTING_IMAGE_BUCKET = 'listing-images';

function isPremiumActive(row) {
  const featured = Boolean(row?.is_featured || row?.is_premium);
  if (!featured) return false;
  const until = row?.featured_until || row?.premium_until;
  if (!until) return true;
  return new Date(until) > new Date();
}

function pickProfile(row) {
  return row?.profiles || row?.profile || row?.seller_profile || null;
}

function randomToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 12);
}

function safeFileName(name = 'image') {
  const cleaned = String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return cleaned || 'image';
}

function isMissingColumn(error) {
  return /column .* does not exist|schema cache|Could not find|PGRST204/i.test(error?.message || error?.details || '');
}

function uniqueListingImagePath(userId, file) {
  return `listings/${userId || 'anonymous'}/${Date.now()}-${randomToken()}-${safeFileName(file?.name)}`;
}

async function uploadListingPhoto(photo, userId) {
  if (photo?.uploadedUrl) return photo.uploadedUrl;
  if (!photo?.file) return '';

  const path = uniqueListingImagePath(userId, photo.file);
  const { error } = await supabase.storage
    .from(LISTING_IMAGE_BUCKET)
    .upload(path, photo.file, {
      cacheControl: '3600',
      upsert: false,
      contentType: photo.type || photo.file.type || undefined,
    });

  if (error) throw new Error(`Fotoğraf yüklenemedi: ${photo.name || photo.file.name}`);

  const { data } = supabase.storage.from(LISTING_IMAGE_BUCKET).getPublicUrl(path);
  return data?.publicUrl || '';
}

async function resolveListingImages(payload) {
  const photos = Array.isArray(payload.photos) ? payload.photos : [];
  const photoFiles = photos.map((photo) => photo.file).filter(Boolean);

  if (photoFiles.length) {
    const validation = validateListingImages(photoFiles);
    if (!validation.ok) throw new Error(validation.error);
  }

  const uploadedPhotoPairs = await Promise.all(
    photos.map(async (photo) => ({ id: photo.id, url: await uploadListingPhoto(photo, payload.user_id) }))
  );
  const uploadedPhotoUrls = uploadedPhotoPairs.map((item) => item.url).filter(Boolean);
  const externalImages = Array.isArray(payload.images) ? payload.images.filter(Boolean) : [];
  const legacyImage = payload.image_url || payload.image || '';
  const images = [...uploadedPhotoUrls, ...externalImages, legacyImage].filter(Boolean);
  const uniqueImages = Array.from(new Set(images));

  const selectedCover = uploadedPhotoPairs.find((item) => item.id === payload.coverPhotoId)?.url || '';
  const coverImageUrl = selectedCover || payload.cover_image_url || uniqueImages[0] || '';

  return { images: uniqueImages, coverImageUrl };
}

export function normalizeListing(row) {
  const { image, images } = sanitizeListingImageFields(row);

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
    categoryId: row?.category_id ?? row?.categoryId ?? null,
    subcategoryId: row?.subcategory_id ?? row?.subcategoryId ?? null,
    brand: row?.brand ?? row?.attributes?.brand ?? row?.metadata?.brand ?? '',
    model: row?.model ?? row?.attributes?.model ?? row?.metadata?.model ?? '',
    attributes: row?.attributes ?? row?.metadata ?? {},
    price: Number(row?.price || 0),
    priceText: row?.price
      ? `${Number(row.price).toLocaleString('tr-TR')} ${row.currency || 'XPF'}`
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
    sellerPlan: row?.seller_plan_at_creation || profile.account_plan || 'free',
    seller_plan_at_creation: row?.seller_plan_at_creation || profile.account_plan || 'free',
    premiumSeller: profile.account_plan === 'premium_seller' && profile.premium_status === 'active',
    listing_type: row?.listing_type || null,
    created_with_free_quota: Boolean(row?.created_with_free_quota),
    expires_at: row?.expires_at || null,
    isBoosted: Boolean(row?.is_boosted),
    boost_ends_at: row?.boost_ends_at || null,
    image,
    images,
    cover_image_url: image,
    badge: premiumActive ? 'Öne çıkan' : row?.status === 'pending' ? 'Onay Bekliyor' : 'Yeni',
    status: row?.status ?? 'pending',
    approval_status: row?.approval_status ?? row?.approvalStatus ?? row?.status ?? 'pending',
    approved_at: row?.approved_at ?? row?.approvedAt ?? null,
    rejected_reason: row?.rejected_reason ?? row?.rejectedReason ?? '',
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
const listingSelectWithProfile = '*, listing_images(image_url, sort_order), profiles:user_id(id, full_name, name, display_name, phone, phone_number, email, verified, is_verified, phone_verified, account_plan, premium_status, premium_started_at, premium_ends_at, has_storefront, response_rate, seller_rating, created_at)';
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
  await assertUserNotSuspended(supabase, payload.user_id);
  const fallbackName = payload.seller_name || payload.sellerName || payload.seller || payload.user_name || payload.email || '';
  const entitlements = await getListingEntitlements(payload.user_id, payload.profile || null);
  if (!entitlements.canCreateStandardListing) {
    throw new Error('Ücretsiz ilan hakkın doldu. Devam etmek için standart ilan satın al veya Premium Satıcı ol.');
  }

  const { images, coverImageUrl } = await resolveListingImages(payload);
  const imageUrl = coverImageUrl || images[0] || '';
  const businessFields = buildListingBusinessFields(entitlements);

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
    cover_image_url: coverImageUrl || null,
    listing_type: businessFields.listing_type,
    created_with_free_quota: businessFields.created_with_free_quota,
    paid_listing_payment_id: payload.paid_listing_payment_id || null,
    seller_plan_at_creation: businessFields.seller_plan_at_creation,
    expires_at: businessFields.expires_at,
    is_boosted: businessFields.is_boosted,
    boost_ends_at: businessFields.boost_ends_at,
  };

  async function tryInsert(record) {
    return supabase.from('listings').insert(record).select().single();
  }

  let { data, error } = await tryInsert({ ...baseInsert, ...optionalInsert });

  if (error && /schema cache|column|Could not find/i.test(error.message || '')) {
    ({ data, error } = await tryInsert(baseInsert));
  }

  if (error) throw error;

  if (businessFields.created_with_free_quota) {
    await consumeFreeListingQuota(payload.user_id, payload.profile || null);
  }

  if (data?.id && images.length > 0) {
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

export async function rejectListing(id, reason = '') {
  const normalizedReason = String(reason || '').trim() || 'Moderasyon tarafından reddedildi.';
  const now = new Date().toISOString();

  let { error } = await supabase
    .from('listings')
    .update({
      status: 'rejected',
      rejected_reason: normalizedReason,
      updated_at: now,
    })
    .eq('id', id);

  if (error && isMissingColumn(error)) {
    console.warn('rejectListing: rejected_reason column missing, falling back to status only:', error.message || error);
    ({ error } = await supabase
      .from('listings')
      .update({
        status: 'rejected',
        updated_at: now,
      })
      .eq('id', id));
  }

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
      is_premium: value,
      featured_until: value ? featuredUntil.toISOString() : null,
      premium_until: value ? featuredUntil.toISOString() : null,
      premium_source: value ? 'admin' : null,
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
