export function formatListingFreshness(value) {
  if (!value || value === 'Yeni') return 'Yeni ilan';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Yeni ilan';
    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    if (diffDays <= 7) return `${diffDays} gün önce`;
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(date);
  } catch {
    return 'Yeni ilan';
  }
}

export function formatPublishedDate(value) {
  if (!value) return 'Yayınlanma tarihi yok';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Yayınlanma tarihi yok';
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'Yayınlanma tarihi yok';
  }
}
