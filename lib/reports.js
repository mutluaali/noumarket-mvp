import { supabase } from './supabase';
import { assertUserNotSuspended } from './suspension';

export const REPORT_STATUSES = {
  OPEN: 'open',
  REVIEWING: 'reviewing',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
};

export const OPEN_REPORT_STATUSES = [REPORT_STATUSES.OPEN, REPORT_STATUSES.REVIEWING];

export const DUPLICATE_OPEN_REPORT_MESSAGE = 'Bu ilan için açık bir şikayetiniz zaten var.';

export const REPORT_REASON_LABELS = {
  fraud: 'Dolandırıcılık / sahte ilan',
  wrong_info: 'Yanlış bilgi veya yanıltıcı fiyat',
  prohibited: 'Yasaklı / uygunsuz ürün',
  duplicate: 'Tekrarlanan ilan',
  other: 'Diğer',
};

export const REPORT_STATUS_LABELS = {
  open: 'Açık',
  reviewing: 'İnceleniyor',
  resolved: 'Çözüldü',
  dismissed: 'Geçersiz sayıldı',
};

export async function findOpenReportForListing({ reporterId, listingId }) {
  if (!supabase || !reporterId || !listingId) return null;

  const { data, error } = await supabase
    .from('listing_reports')
    .select('id, status, created_at')
    .eq('reporter_id', reporterId)
    .eq('listing_id', listingId)
    .in('status', OPEN_REPORT_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createReport({ reporterId, listingId, reason, details }) {
  if (!supabase) throw new Error('Supabase bağlantısı yok. .env.local dosyasını kontrol et.');
  if (!reporterId) throw new Error('Şikayet göndermek için giriş yapmalısın.');
  if (!listingId) throw new Error('İlan ID bulunamadı.');
  if (!reason) throw new Error('Şikayet sebebi seçmelisin.');

  await assertUserNotSuspended(supabase, reporterId);

  const existing = await findOpenReportForListing({ reporterId, listingId });
  if (existing) {
    throw new Error(DUPLICATE_OPEN_REPORT_MESSAGE);
  }

  const { data, error } = await supabase
    .from('listing_reports')
    .insert({
      reporter_id: reporterId,
      listing_id: listingId,
      reason,
      details: details || '',
      status: REPORT_STATUSES.OPEN,
    })
    .select('id, listing_id, reporter_id, reason, details, status, created_at')
    .single();

  if (error) {
    if (error.code === '23505' || /duplicate|unique/i.test(error.message || '')) {
      throw new Error(DUPLICATE_OPEN_REPORT_MESSAGE);
    }
    throw error;
  }

  return data;
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

export async function fetchAdminReports({ status = 'open' } = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error('Yönetim oturumu bulunamadı.');

  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);

  const response = await fetch(`/api/admin/reports?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Şikayetler yüklenemedi.');
  return payload.data || [];
}

export async function updateReportStatus(reportId, status) {
  const token = await getAccessToken();
  if (!token) throw new Error('Yönetim oturumu bulunamadı.');
  if (!reportId) throw new Error('Şikayet ID bulunamadı.');

  const response = await fetch(`/api/admin/reports/${reportId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Şikayet güncellenemedi.');
  return payload;
}
