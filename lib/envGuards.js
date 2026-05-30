import { createClient } from '@supabase/supabase-js';

const PLACEHOLDER_SERVICE_ROLE_KEYS = new Set([
  'build-placeholder-service-role-key',
  'build-placeholder-key',
]);

const PLACEHOLDER_SUPABASE_URLS = new Set([
  'https://example.supabase.co',
  'http://example.supabase.co',
]);

export function isPlaceholderServiceRoleKey(value) {
  if (!value || typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (PLACEHOLDER_SERVICE_ROLE_KEYS.has(trimmed)) return true;
  if (trimmed.startsWith('build-placeholder')) return true;
  return false;
}

function isPlaceholderSupabaseUrl(value) {
  if (!value || typeof value !== 'string') return true;
  const normalized = value.trim().toLowerCase().replace(/\/$/, '');
  if (!normalized) return true;
  if (PLACEHOLDER_SUPABASE_URLS.has(normalized)) return true;
  return normalized.includes('example.supabase.co');
}

export function getMissingPublicSupabaseEnv() {
  const missing = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  else if (isPlaceholderSupabaseUrl(url)) missing.push('NEXT_PUBLIC_SUPABASE_URL');

  if (!anon) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return missing;
}

export function hasPublicSupabaseConfig() {
  return getMissingPublicSupabaseEnv().length === 0;
}

export function getPublicSupabaseConfigMessage(options = {}) {
  const missing = getMissingPublicSupabaseEnv();
  if (!missing.length) return '';

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !options.detailed) {
    return 'NouMarket yapılandırması eksik. Lütfen daha sonra tekrar deneyin.';
  }

  return `Supabase yapılandırması eksik (${missing.join(', ')}). .env.local dosyasını kontrol edin.`;
}

export function getServiceRoleConfigError() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || isPlaceholderSupabaseUrl(url)) {
    return { message: 'NEXT_PUBLIC_SUPABASE_URL eksik veya geçersiz.', status: 500 };
  }

  if (!serviceKey) {
    return { message: 'SUPABASE_SERVICE_ROLE_KEY eksik.', status: 500 };
  }

  if (isPlaceholderServiceRoleKey(serviceKey)) {
    return { message: 'SUPABASE_SERVICE_ROLE_KEY geçersiz veya placeholder.', status: 500 };
  }

  return null;
}

export function createServiceRoleClient() {
  const configError = getServiceRoleConfigError();
  if (configError) {
    const error = new Error(configError.message);
    error.status = configError.status;
    error.code = 'SUPABASE_SERVICE_CONFIG';
    throw error;
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY.trim(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export function tryCreateServiceRoleClient() {
  const configError = getServiceRoleConfigError();
  if (configError) {
    return { supabase: null, configError };
  }

  return { supabase: createServiceRoleClient(), configError: null };
}

export function isServiceRoleConfigError(error) {
  return error?.code === 'SUPABASE_SERVICE_CONFIG';
}
