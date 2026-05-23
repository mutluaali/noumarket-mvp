export function buildListingAssistantDraft(form = {}) {
  const category = form.category || 'Diğer';
  const subcategory = form.subcategory || 'Genel';
  const metadata = form.metadata || {};
  const brand = metadata.brand || metadata.marine_type || '';
  const model = metadata.model || '';
  const year = metadata.year || '';
  const location = form.location || 'Nouméa';
  const conditionMap = {
    new: 'Yeni',
    like_new: 'Yeni gibi',
    used: 'Kullanılmış',
    needs_repair: 'Tamir gerekir',
  };
  const condition = conditionMap[form.condition] || 'Kullanılmış';

  const core = [brand, model, year].filter(Boolean).join(' ');
  const titleBase = core || subcategory;

  const title = `${titleBase} - ${condition} - ${location}`.replace(/\s+/g, ' ').trim();

  const lines = [
    `${titleBase} için ilan detayları:`,
    '',
    `Durum: ${condition}`,
    `Kategori: ${category} / ${subcategory}`,
    `Konum: ${location}`,
  ];

  if (category === 'Araç') {
    if (metadata.mileage) lines.push(`Kilometre: ${Number(metadata.mileage).toLocaleString('fr-FR')} km`);
    if (metadata.fuel) lines.push(`Yakıt: ${metadata.fuel}`);
    if (metadata.transmission) lines.push(`Vites: ${metadata.transmission}`);
  }

  if (category === 'Emlak') {
    if (metadata.rooms) lines.push(`Oda sayısı: ${metadata.rooms}`);
    if (metadata.area_m2) lines.push(`Alan: ${metadata.area_m2} m²`);
    if (metadata.furnished) lines.push(`Eşyalı: ${metadata.furnished}`);
  }

  if (category === 'Elektronik') {
    if (metadata.warranty) lines.push(`Garanti: ${metadata.warranty}`);
  }

  lines.push('', 'Ürün/ilan görsellerdeki gibidir. Ciddi alıcılar mesaj veya WhatsApp üzerinden ulaşabilir. Pazarlık durumu yüz yüze görüşülebilir.');

  return {
    title,
    description: lines.join('\n'),
  };
}

export function getPricingHint(form = {}) {
  const category = form.category || 'Diğer';
  const price = Number(form.price || 0);
  if (!price) return 'Fiyat girersen ilan daha güvenilir görünür ve filtrelerde daha iyi çalışır.';

  if (category === 'Elektronik' && price > 250000) return 'Elektronik kategorisinde yüksek fiyat var. Model, garanti ve kutu durumunu açık yaz.';
  if (category === 'Araç' && price < 300000) return 'Araç fiyatı çok düşük görünüyor. Hasar, evrak veya tamir gereksinimi varsa açık belirt.';
  if (category === 'Emlak' && price < 50000) return 'Emlak fiyatı düşük görünüyor. Kiralık/satılık bilgisini ve depozitoyu netleştir.';
  return 'Fiyat makul görünüyor. Pazarlık payını açıklamada belirtmen dönüşümü artırır.';
}

export function getTrustWarnings(form = {}, imageCount = 0) {
  const warnings = [];
  const description = String(form.description || '').toLowerCase();
  const title = String(form.title || '').toLowerCase();
  const risky = ['kapora', 'acil para', 'western union', 'ön ödeme', 'şifre', 'kimlik fotoğrafı'];

  risky.forEach((word) => {
    if (description.includes(word) || title.includes(word)) warnings.push(`Riskli ifade: “${word}”. Güven için açıklamayı daha net ve kontrollü yaz.`);
  });

  if (imageCount === 0) warnings.push('Fotoğraf yok. Fotoğrafsız ilanlar güveni ve mesaj oranını ciddi düşürür.');
  if ((form.description || '').trim().length < 80) warnings.push('Açıklama kısa. Kusur, teslimat ve pazarlık bilgisini ekle.');

  return warnings;
}
