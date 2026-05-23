import { supabase } from './supabase';

const PROFILE_FIELDS = 'id, full_name, phone, role, avatar_url, created_at, updated_at';

function emptyProfile(userId) {
  return {
    id: userId,
    full_name: null,
    phone: null,
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

export async function getCurrentProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .maybeSingle();

  if (!error) return data || emptyProfile(userId);

  if (isMissingRow(error)) return emptyProfile(userId);

  // Eski veritabanlarında avatar_url / updated_at gibi kolonlar eksik olabilir.
  // Profil okumayı tamamen kırmak yerine daha dar bir sorguyla devam ediyoruz.
  if (isMissingOptionalColumn(error)) {
    const retry = await supabase
      .from('profiles')
      .select('id, full_name, phone, role')
      .eq('id', userId)
      .maybeSingle();

    if (!retry.error) return { ...emptyProfile(userId), ...(retry.data || {}) };
    if (isMissingRow(retry.error)) return emptyProfile(userId);
  }

  // Next.js dev overlay console.error çağrılarını ekranı kilitleyen hata gibi gösteriyor.
  // Profil okunamazsa uygulamayı düşürmüyoruz; kullanıcı ilanları gezmeye devam eder.
  console.warn('Profile read skipped:', error?.message || error);
  return emptyProfile(userId);
}

export function userIsAdmin(profile) {
  return profile?.role === 'admin' || profile?.role === 'moderator';
}

export async function upsertCurrentProfile(userId, payload = {}) {
  if (!userId) throw new Error('Kullanıcı bulunamadı.');

  const clean = {
    id: userId,
    full_name: payload.full_name?.trim() || null,
    phone: payload.phone?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(clean, { onConflict: 'id' })
    .select(PROFILE_FIELDS)
    .maybeSingle();

  if (!error) return data || emptyProfile(userId);

  if (isMissingOptionalColumn(error)) {
    const fallbackPayload = {
      id: userId,
      full_name: clean.full_name,
      phone: clean.phone,
    };

    const retry = await supabase
      .from('profiles')
      .upsert(fallbackPayload, { onConflict: 'id' })
      .select('id, full_name, phone, role')
      .maybeSingle();

    if (!retry.error) return { ...emptyProfile(userId), ...(retry.data || {}) };
    throw retry.error;
  }

  throw error;
}
