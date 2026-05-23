import { supabase } from './supabase';

export async function createReport({ reporterId, listingId, reason, details }) {
  if (!supabase) throw new Error('Supabase bağlantısı yok. .env.local dosyasını kontrol et.');
  if (!reporterId) throw new Error('Şikayet göndermek için giriş yapmalısın.');
  if (!listingId) throw new Error('İlan ID bulunamadı.');
  if (!reason) throw new Error('Şikayet sebebi seçmelisin.');

  const { data, error } = await supabase
    .from('listing_reports')
    .insert({
      reporter_id: reporterId,
      listing_id: listingId,
      reason,
      details: details || '',
      status: 'open',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
