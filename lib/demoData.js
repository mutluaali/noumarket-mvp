export function formatXpf(value) {
  if (!value) return 'Görüşülür';
  return `${Number(value).toLocaleString('tr-TR')} XPF`;
}
