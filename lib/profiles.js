import { supabase, hasSupabase } from './supabase';

const PROFILE_FIELDS = 'id, full_name, store_name, phone, location, bio, role, avatar_url, is_verified, phone_verified, phone_verification_requested_at, seller_rating, response_rate, created_at, updated_at';

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

export async function upsertCurrentProfile(userId, payload = {}) {
  if (!userId) throw new Error('Kullanıcı bulunamadı.');
  if (!hasSupabase || !supabase) throw new Error('Supabase bağlantısı bulunamadı.');

  const clean = {
    id: userId,
    full_name: payload.full_name?.trim() || null,
    store_name: payload.store_name?.trim() || null,
    phone: payload.phone?.trim() || null,
    location: payload.location?.trim() || null,
    bio: payload.bio?.trim() || null,
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
