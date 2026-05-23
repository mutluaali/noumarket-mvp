const riskyWords = ['kapora', 'western union', 'crypto only', 'acil ödeme', 'ön ödeme', 'advance payment', 'wire transfer only'];

export function scoreListingQuality(form = {}, imageCount = 0) {
  let score = 0;
  const suggestions = [];
  const title = String(form.title || '').trim();
  const description = String(form.description || '').trim();
  const price = Number(form.price || 0);
  const metadataValues = Object.values(form.metadata || {}).filter(Boolean);
  const text = `${title} ${description}`.toLowerCase();

  if (title.length >= 12) score += 18;
  else suggestions.push('Başlığı biraz daha açıklayıcı yap.');

  if (description.length >= 80) score += 22;
  else suggestions.push('Açıklamaya durum, kusur, teslimat ve pazarlık bilgisini ekle.');

  if (imageCount >= 3) score += 22;
  else if (imageCount >= 1) score += 12;
  else suggestions.push('En az 3 gerçek fotoğraf güveni ciddi artırır.');

  if (price > 0) score += 12;
  else suggestions.push('Fiyat belirtmek mesaj kalitesini artırır.');

  if (form.location) score += 8;
  if (metadataValues.length >= 2) score += 12;
  else suggestions.push('Kategoriye özel alanlardan birkaçını doldur.');

  if (form.seller_phone) score += 6;

  const riskHits = riskyWords.filter((word) => text.includes(word));
  if (riskHits.length) {
    score = Math.max(0, score - 25);
    suggestions.push('Ön ödeme/kapora gibi ifadeler güven riskini yükseltir. Açıklamayı netleştir.');
  }

  const level = score >= 80 ? 'Çok güçlü' : score >= 60 ? 'Yeterli' : score >= 40 ? 'Zayıf' : 'Riskli';
  return { score: Math.min(100, score), level, suggestions: suggestions.slice(0, 4), riskHits };
}
