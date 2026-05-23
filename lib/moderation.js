const BLOCKED_WORDS = [
  'western union',
  'moneygram',
  'crypto only',
  'bitcoin only',
  'advance payment',
  'deposit before viewing',
  'no inspection',
  'whatsapp only urgent',
  'too good to be true',
];

const HIGH_RISK_PATTERNS = [
  /\b(?:free|gratuit)\b/i,
  /\b(?:urgent|acil|very urgent)\b/i,
  /\b(?:wire transfer|virement avant|havale önce)\b/i,
  /\b(?:pay first|önce ödeme|payer avant)\b/i,
];

function normalizeText(value = '') {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function analyzeListingSafety(listing = {}) {
  const title = normalizeText(listing.title);
  const description = normalizeText(listing.description);
  const sellerPhone = normalizeText(listing.seller_phone || listing.sellerPhone || listing.phone);
  const text = `${title} ${description}`;

  const hits = BLOCKED_WORDS.filter((word) => text.includes(word));
  const patternHits = HIGH_RISK_PATTERNS.filter((pattern) => pattern.test(text)).length;

  let score = 0;
  const reasons = [];

  if (hits.length) {
    score += hits.length * 28;
    reasons.push(`Riskli kelime/ifade: ${hits.join(', ')}`);
  }

  if (patternHits) {
    score += patternHits * 14;
    reasons.push('Acil/ön ödeme baskısı benzeri ifade algılandı.');
  }

  if (!sellerPhone) {
    score += 10;
    reasons.push('Telefon bilgisi eksik.');
  }

  if ((listing.price || 0) > 0 && String(listing.price).length <= 3) {
    score += 8;
    reasons.push('Fiyat gerçekçi görünmeyebilir.');
  }

  if (description.length < 40) {
    score += 8;
    reasons.push('Açıklama çok kısa.');
  }

  const riskScore = Math.min(100, score);
  const level = riskScore >= 55 ? 'high' : riskScore >= 25 ? 'medium' : 'low';

  return {
    riskScore,
    level,
    reasons,
    shouldHold: level === 'high',
  };
}

export function getModerationStatusLabel(status) {
  if (status === 'blocked') return 'Engellendi';
  if (status === 'review') return 'İnceleme';
  if (status === 'approved') return 'Temiz';
  return 'Bekliyor';
}
