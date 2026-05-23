export function normalizePhoneNumber(phone = '') {
  return String(phone || '').replace(/[^0-9+]/g, '');
}

export function calculateProfileTrust(profile = {}, user = {}) {
  const checks = [
    { key: 'email', label: 'E-posta hesabı', ok: Boolean(user?.email || profile?.email), points: 20 },
    { key: 'name', label: 'Ad/mağaza adı', ok: Boolean(profile?.full_name || profile?.store_name), points: 20 },
    { key: 'phone', label: 'Telefon/WhatsApp', ok: normalizePhoneNumber(profile?.phone).length >= 6, points: 15 },
    { key: 'phone_verified', label: 'Telefon doğrulaması', ok: Boolean(profile?.phone_verified), points: 15 },
    { key: 'location', label: 'Konum bilgisi', ok: Boolean(profile?.location), points: 15 },
    { key: 'bio', label: 'Profil açıklaması', ok: String(profile?.bio || '').trim().length >= 20, points: 10 },
    { key: 'verified', label: 'Admin doğrulaması', ok: Boolean(profile?.is_verified), points: 10 },
  ];

  const score = checks.reduce((sum, check) => sum + (check.ok ? check.points : 0), 0);
  const level = score >= 80 ? 'Güçlü' : score >= 55 ? 'Orta' : 'Zayıf';
  const color = score >= 80 ? 'emerald' : score >= 55 ? 'amber' : 'red';

  return { score, level, color, checks };
}

export function calculateListingTrust(listing = {}) {
  const phoneOk = normalizePhoneNumber(listing.phone || listing.seller_phone).length >= 6;
  const emailOk = Boolean(listing.email || listing.seller_email);
  const hasImages = Array.isArray(listing.images) ? listing.images.length > 0 : Boolean(listing.image || listing.image_url);
  const hasDescription = String(listing.description || '').trim().length >= 40;
  const hasLocation = Boolean(listing.location);

  let score = 0;
  if (phoneOk) score += 25;
  if (emailOk) score += 15;
  if (hasImages) score += 20;
  if (hasDescription) score += 20;
  if (hasLocation) score += 20;

  const level = score >= 80 ? 'Güven yüksek' : score >= 55 ? 'Kontrol et' : 'Düşük güven';
  const color = score >= 80 ? 'emerald' : score >= 55 ? 'amber' : 'red';

  return { score, level, color, checks: { phoneOk, emailOk, hasImages, hasDescription, hasLocation } };
}
