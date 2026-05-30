'use client';

import { X } from 'lucide-react';

const SORT_LABELS = {
  newest: 'En yeni',
  price_asc: 'En düşük fiyat',
  price_desc: 'En yüksek fiyat',
  popular: 'En çok görüntülenen',
  featured: 'Öne çıkanlar',
};

function formatPriceChip(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return `${Number(digits).toLocaleString('tr-TR')} XPF`;
}

function Chip({ label, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-900 ring-1 ring-cyan-200 dark:bg-cyan-400/10 dark:text-cyan-100 dark:ring-cyan-300/20"
    >
      <span className="truncate">{label}</span>
      <X size={14} className="shrink-0 opacity-70" aria-hidden="true" />
    </button>
  );
}

export default function ActiveFilterChips({
  query = '',
  categoryLabel = '',
  location = 'Tumu',
  minPrice = '',
  maxPrice = '',
  sort = 'newest',
  onRemove,
  onClearAll,
}) {
  const chips = [];

  if (query.trim()) {
    chips.push({ key: 'query', label: `Arama: ${query.trim()}` });
  }
  if (categoryLabel) {
    chips.push({ key: 'category', label: `Kategori: ${categoryLabel}` });
  }
  if (location && location !== 'Tumu') {
    chips.push({ key: 'location', label: `Konum: ${location}` });
  }
  if (minPrice) {
    chips.push({ key: 'minPrice', label: `Min: ${formatPriceChip(minPrice)}` });
  }
  if (maxPrice) {
    chips.push({ key: 'maxPrice', label: `Max: ${formatPriceChip(maxPrice)}` });
  }
  if (sort && sort !== 'newest') {
    chips.push({ key: 'sort', label: `Sıralama: ${SORT_LABELS[sort] || sort}` });
  }

  if (!chips.length) return null;

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Aktif filtreler</span>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-black text-rose-600 hover:text-rose-700 dark:text-rose-300"
        >
          Tüm filtreleri temizle
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Chip key={chip.key} label={chip.label} onRemove={() => onRemove?.(chip.key)} />
        ))}
      </div>
    </div>
  );
}

export { SORT_LABELS };
