import { categories, locations } from '@/lib/categories';

const categoryKeywords = {
  Araç: ['araç', 'araba', 'otomobil', 'suv', '4x4', 'pickup', 'motosiklet', 'toyota', 'hilux', 'hyundai', 'peugeot', 'renault', 'dizel', 'benzin', 'otomatik', 'manuel'],
  Emlak: ['emlak', 'ev', 'daire', 'villa', 'arsa', 'kiralık', 'satılık', 'oda', 'stüdyo', 'studio', 'appartement', 'maison', 'terrain', 'rent', 'rental'],
  Elektronik: ['telefon', 'iphone', 'samsung', 'apple', 'bilgisayar', 'laptop', 'tablet', 'tv', 'kamera', 'playstation', 'ps5', 'xbox'],
  Denizcilik: ['tekne', 'bot', 'deniz', 'marine', 'boat', 'jet ski', 'jetski', 'motor', 'yamaha', 'mercury', 'marina'],
  'Ev & Yaşam': ['mobilya', 'koltuk', 'masa', 'sandalye', 'buzdolabı', 'çamaşır', 'yatak', 'dekorasyon', 'bahçe'],
  'İş / Hizmet': ['iş', 'hizmet', 'usta', 'servis', 'temizlik', 'nakliye', 'ders', 'danışmanlık', 'job', 'service'],
  'Yedek Parça': ['yedek', 'parça', 'oem', 'spare', 'part', 'filtre', 'lastik', 'jant'],
  Hayvanlar: ['kedi', 'köpek', 'kuş', 'balık', 'hayvan', 'chat', 'chien'],
};

const stopWords = new Set([
  'içinde', 'civarında', 'yakın', 'yakını', 'altı', 'üstü', 'kadar', 'olan', 've', 'ile', 'bir', 'en', 'az', 'çok', 'xpf', 'frank', 'cfp',
  'under', 'below', 'over', 'above', 'near', 'in', 'with', 'and', 'or', 'the', 'for', 'de', 'la', 'le', 'les', 'moins', 'plus', 'que', 'avec',
]);

function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9ğüşıöç\s.,]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumber(rawNumber, suffix = '') {
  const base = Number(String(rawNumber || '').replace(',', '.'));
  if (Number.isNaN(base)) return null;
  const normalizedSuffix = normalize(suffix);
  if (['m', 'mn', 'milyon', 'million'].includes(normalizedSuffix)) return Math.round(base * 1_000_000);
  if (['k', 'bin', 'mille'].includes(normalizedSuffix)) return Math.round(base * 1_000);
  return Math.round(base);
}

function detectPrice(text) {
  const normalized = normalize(text);
  const compact = normalized.replace(/\s+/g, ' ');

  const maxPatterns = [
    /(\d+(?:[.,]\d+)?)\s*(milyon|million|mn|m|bin|mille|k)?\s*(?:xpf|cfp|frank)?\s*(?:alt[iı]|alts?nda|kadar|dan az|den az|under|below|moins de)/,
    /(?:alt[iı]|under|below|moins de)\s*(\d+(?:[.,]\d+)?)\s*(milyon|million|mn|m|bin|mille|k)?/,
  ];
  const minPatterns = [
    /(\d+(?:[.,]\d+)?)\s*(milyon|million|mn|m|bin|mille|k)?\s*(?:xpf|cfp|frank)?\s*(?:ust[uü]|uzeri|den fazla|dan fazla|over|above|plus de)/,
    /(?:ust[uü]|over|above|plus de)\s*(\d+(?:[.,]\d+)?)\s*(milyon|million|mn|m|bin|mille|k)?/,
  ];

  for (const pattern of maxPatterns) {
    const match = compact.match(pattern);
    const value = match ? parseNumber(match[1], match[2]) : null;
    if (value) return { maxPrice: String(value) };
  }

  for (const pattern of minPatterns) {
    const match = compact.match(pattern);
    const value = match ? parseNumber(match[1], match[2]) : null;
    if (value) return { minPrice: String(value) };
  }

  return {};
}

function detectLocation(text) {
  const normalized = normalize(text);
  const match = locations.find((location) => location !== 'Tümü' && normalized.includes(normalize(location)));
  return match || 'Tümü';
}

function detectCategory(text) {
  const normalized = normalize(text);
  let best = { category: 'Tümü', score: 0 };

  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    const score = keywords.reduce((total, keyword) => total + (normalized.includes(normalize(keyword)) ? 1 : 0), 0);
    if (score > best.score) best = { category, score };
  });

  return categories.includes(best.category) ? best.category : 'Tümü';
}

function detectSort(text) {
  const normalized = normalize(text);
  if (/(en ucuz|ucuzdan|cheapest|moins cher|price low)/.test(normalized)) return 'price_asc';
  if (/(en pahali|pahalidan|most expensive|plus cher|price high)/.test(normalized)) return 'price_desc';
  if (/(populer|popular|cok goruntulenen|views)/.test(normalized)) return 'popular';
  return 'newest';
}

function extractKeywords(text, detected = {}) {
  const normalized = normalize(text);
  const removePieces = [detected.location, detected.category, 'xpf', 'cfp', 'frank', 'milyon', 'million', 'bin', 'mille'];
  let cleaned = normalized;

  removePieces.filter(Boolean).forEach((piece) => {
    cleaned = cleaned.replace(new RegExp(`\\b${normalize(piece).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), ' ');
  });

  cleaned = cleaned
    .replace(/\d+(?:[.,]\d+)?\s*(milyon|million|mn|m|bin|mille|k)?/g, ' ')
    .replace(/\b(alt[iı]|alts?nda|ust[uü]|uzeri|kadar|under|below|over|above|moins|plus)\b/g, ' ');

  const tokens = cleaned.split(/\s+/).filter((token) => token.length > 1 && !stopWords.has(token));
  return Array.from(new Set(tokens)).slice(0, 6).join(' ');
}

export function parseSmartSearch(input = '') {
  const original = String(input || '').trim();
  if (!original) {
    return { query: '', category: 'Tümü', location: 'Tümü', minPrice: '', maxPrice: '', sort: 'newest', confidence: 0, hints: [] };
  }

  const category = detectCategory(original);
  const location = detectLocation(original);
  const price = detectPrice(original);
  const sort = detectSort(original);
  const keywordQuery = extractKeywords(original, { category, location });

  const hints = [];
  if (category !== 'Tümü') hints.push(`Kategori: ${category}`);
  if (location !== 'Tümü') hints.push(`Konum: ${location}`);
  if (price.minPrice) hints.push(`Min: ${Number(price.minPrice).toLocaleString('fr-FR')} XPF`);
  if (price.maxPrice) hints.push(`Max: ${Number(price.maxPrice).toLocaleString('fr-FR')} XPF`);
  if (keywordQuery) hints.push(`Anahtar: ${keywordQuery}`);

  const confidence = Math.min(100, 25 + hints.length * 18 + (keywordQuery ? 12 : 0));

  return {
    query: keywordQuery || original,
    category,
    location,
    minPrice: price.minPrice || '',
    maxPrice: price.maxPrice || '',
    sort,
    confidence,
    hints,
  };
}
