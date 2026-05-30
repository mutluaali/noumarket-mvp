import { supabase, hasSupabase } from './supabase';
import { isUserSuspended } from './suspension';

const PROFILE_FIELDS = 'id, full_name, store_name, phone, location, bio, role, avatar_url, is_verified, phone_verified, phone_verification_requested_at, seller_rating, response_rate, account_plan, premium_status, premium_started_at, premium_ends_at, yearly_free_listing_limit, yearly_free_listing_used, free_listing_cycle_year, listing_photo_limit, can_add_video, has_storefront, boost_discount_percent, is_suspended, suspended_at, created_at, updated_at';

export const PUBLIC_SELLER_FIELDS = 'id, full_name, store_name, phone, location, bio, avatar_url, is_verified, phone_verified, seller_rating, response_rate, is_suspended, created_at';

export const USER_EDITABLE_PROFILE_FIELDS = [
  'full_name',
  'store_name',
  'phone',
  'location',
  'bio',
  'avatar_url',
];

function emptyProfile(userId) {
  return {
    id: userId,
    full_name: null,
    phone: null,
    store_name: null,
    location: null,
    bio: null,
    is_verified: false,
    phone_verified: false,
    phone_verification_requested_at: null,
    seller_rating: null,
    response_rate: null,
    avatar_url: null,
    role: 'user',
    account_plan: 'free',
    premium_status: 'inactive',
    premium_started_at: null,
    premium_ends_at: null,
    yearly_free_listing_limit: 1,
    yearly_free_listing_used: 0,
    free_listing_cycle_year: new Date().getFullYear(),
    listing_photo_limit: 5,
    can_add_video: false,
    has_storefront: false,
    boost_discount_percent: 0,
    is_suspended: false,
    suspended_at: null,
    created_at: null,
    updated_at: null,
  };
}

function isMissingRow(error) {
  return error?.code === 'PGRST116' || /0 rows|no rows/i.test(error?.message || '');
}

function isMissingOptionalColumn(error) {
  return error?.code === '42703' || /column .* does not exist/i.test(error?.message || '');
}

function isTimeout(error) {
  return /zaman aşımı|timeout|timed out|aborted/i.test(error?.message || '');
}

function withTimeout(promise, ms = 6500, label = 'İstek') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} zaman aşımına uğradı.`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function getCurrentProfile(userId) {
  if (!userId) return null;
  if (!hasSupabase || !supabase) return emptyProfile(userId);

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('profiles')
        .select(PROFILE_FIELDS)
        .eq('id', userId)
        .maybeSingle(),
      6500,
      'Profil okuma'
    );

    if (!error) return data || emptyProfile(userId);
    if (isMissingRow(error)) return emptyProfile(userId);

    if (isMissingOptionalColumn(error)) {
      const retry = await withTimeout(
        supabase
          .from('profiles')
          .select('id, full_name, store_name, phone, location, bio, role, avatar_url, is_verified, phone_verified, created_at, updated_at')
          .eq('id', userId)
          .maybeSingle(),
        6500,
        'Profil okuma'
      );

      if (!retry.error) return { ...emptyProfile(userId), ...(retry.data || {}) };
      if (isMissingRow(retry.error)) return emptyProfile(userId);
    }

    console.warn('Profile read skipped:', error?.message || error);
    return emptyProfile(userId);
  } catch (error) {
    if (isTimeout(error)) return emptyProfile(userId);
    console.warn('Profile read fallback:', error?.message || error);
    return emptyProfile(userId);
  }
}

export function userIsAdmin(profile) {
  return profile?.role === 'admin' || profile?.role === 'moderator';
}

export { isUserSuspended };

export function getSellerDisplayName(profile = {}) {
  return profile?.store_name || profile?.full_name || 'NouMarket satıcısı';
}

export function buildUserProfilePayload(payload = {}) {
  const clean = {};

  if (payload.full_name !== undefined) clean.full_name = String(payload.full_name || '').trim() || null;
  if (payload.store_name !== undefined) clean.store_name = String(payload.store_name || '').trim() || null;
  if (payload.phone !== undefined) clean.phone = String(payload.phone || '').trim() || null;
  if (payload.location !== undefined) clean.location = String(payload.location || '').trim() || null;
  if (payload.bio !== undefined) clean.bio = String(payload.bio || '').trim() || null;
  if (payload.avatar_url !== undefined) {
    const avatarUrl = String(payload.avatar_url || '').trim();
    clean.avatar_url = avatarUrl || null;
  }

  return clean;
}

export async function getPublicSellerProfile(userId) {
  if (!userId) return null;
  if (!hasSupabase || !supabase) return null;

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('profiles')
        .select(PUBLIC_SELLER_FIELDS)
        .eq('id', userId)
        .maybeSingle(),
      6500,
      'Satıcı profili okuma'
    );

    if (!error) return data || null;

    if (isMissingOptionalColumn(error)) {
      const retry = await withTimeout(
        supabase
          .from('profiles')
          .select('id, full_name, store_name, phone, location, bio, is_verified, phone_verified, created_at')
          .eq('id', userId)
          .maybeSingle(),
        6500,
        'Satıcı profili okuma'
      );
      if (!retry.error) return retry.data || null;
    }

    console.warn('Public seller profile read skipped:', error?.message || error);
    return null;
  } catch (error) {
    console.warn('Public seller profile fallback:', error?.message || error);
    return null;
  }
}

export async function getSellerActiveListingCount(userId) {
  if (!userId) return 0;
  if (!hasSupabase || !supabase) return 0;

  try {
    const { count, error } = await withTimeout(
      supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'approved'),
      6500,
      'Satıcı ilan sayısı'
    );

    if (error) throw error;
    return Number(count || 0);
  } catch (error) {
    console.warn('Seller listing count fallback:', error?.message || error);
    return 0;
  }
}

export async function upsertCurrentProfile(userId, payload = {}) {
  if (!userId) throw new Error('Kullanıcı bulunamadı.');
  if (!hasSupabase || !supabase) throw new Error('Supabase bağlantısı bulunamadı.');

  const clean = {
    id: userId,
    ...buildUserProfilePayload(payload),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await withTimeout(
    supabase
      .from('profiles')
      .upsert(clean, { onConflict: 'id' })
      .select(PROFILE_FIELDS)
      .maybeSingle(),
    8000,
    'Profil kaydetme'
  );

  if (!error) return data || emptyProfile(userId);

  if (isMissingOptionalColumn(error)) {
    const fallbackPayload = {
      id: userId,
      full_name: clean.full_name,
      phone: clean.phone,
    };

    const retry = await withTimeout(
      supabase
        .from('profiles')
        .upsert(fallbackPayload, { onConflict: 'id' })
        .select('id, full_name, phone, role')
        .maybeSingle(),
      8000,
      'Profil kaydetme'
    );

    if (!retry.error) return { ...emptyProfile(userId), ...(retry.data || {}) };
    throw retry.error;
  }

  throw error;
}

export async function requestPhoneVerification(userId, phone) {
  if (!userId) throw new Error('Telefon doğrulaması için giriş yapmalısın.');
  if (!hasSupabase || !supabase) throw new Error('Supabase bağlantısı bulunamadı.');

  const cleanPhone = String(phone || '').trim();
  if (cleanPhone.replace(/[^0-9]/g, '').length < 6) {
    throw new Error('Geçerli bir telefon numarası gir.');
  }

  const payload = {
    id: userId,
    phone: cleanPhone,
    phone_verification_requested_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await withTimeout(
    supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select(PROFILE_FIELDS)
      .maybeSingle(),
    8000,
    'Telefon doğrulama isteği'
  );

  if (!error) return data || { ...emptyProfile(userId), ...payload };

  if (isMissingOptionalColumn(error)) {
    const retry = await withTimeout(
      supabase
        .from('profiles')
        .upsert({ id: userId, phone: cleanPhone, updated_at: new Date().toISOString() }, { onConflict: 'id' })
        .select('id, full_name, phone, role')
        .maybeSingle(),
      8000,
      'Telefon doğrulama isteği'
    );
    if (!retry.error) return { ...emptyProfile(userId), ...(retry.data || {}), phone_verification_requested_at: new Date().toISOString() };
    throw retry.error;
  }

  throw error;
}
