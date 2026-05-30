'use client';

import { useState } from 'react';
import { Heart, MapPin, Clock, Crown, ShieldCheck, Eye } from 'lucide-react';
import { formatXpf } from '@/lib/demoData';
import { formatListingFreshness } from '@/lib/formatListingDate';
import { pickListingImageUrl, pickListingImageUrls } from '@/lib/listingImages';
import ListingImageFallback from '@/components/ListingImageFallback';

function formatPrice(item) {
  if (item.priceText) return item.priceText;
  if (formatXpf && item.price) return formatXpf(item.price);
  if (item.price) return `${Number(item.price).toLocaleString('tr-TR')} XPF`;
  return 'Görüşülür';
}

function categoryLabel(item) {
  const parts = [item.subcategory, item.category].filter(Boolean);
  return parts.join(' · ') || 'Genel';
}

export default function ListingCard({ item, onClick, onFavorite, isFavorite = false }) {
  const [broken, setBroken] = useState(false);
  const imageUrl = pickListingImageUrl(item);
  const gallery = pickListingImageUrls(item);
  const showFallback = !imageUrl || broken;
  const photoCount = gallery.length;
  const freshness = formatListingFreshness(item.createdAt || item.created_at);
  const trusted = Boolean(
    item.seller_verified
      || item.sellerVerified
      || Number(item.trustScore || item.trust_score || 0) >= 70
  );
  const priceLabel = formatPrice(item);

  function handleFavoriteClick(event) {
    event.stopPropagation();
    onFavorite?.(item);
  }

  return (
    <article
      onClick={onClick}
      className="nm-card group cursor-pointer overflow-hidden rounded-card border border-[var(--field-border)] transition duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-white/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
        {showFallback ? (
          <ListingImageFallback compact />
        ) : (
          <img
            src={imageUrl}
            alt={item.title || 'İlan görseli'}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

        {onFavorite ? (
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full shadow-lg backdrop-blur-md ring-1 transition active:scale-95 ${isFavorite ? 'bg-rose-500 text-white ring-rose-300' : 'bg-white/95 text-slate-700 ring-white/80 hover:bg-white dark:bg-slate-950/85 dark:text-white dark:ring-white/15'}`}
            aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <Heart size={17} className={isFavorite ? 'fill-current' : ''} />
          </button>
        ) : null}

        <div className="absolute left-3 top-3 flex max-w-[calc(100%-3.75rem)] flex-wrap gap-1.5">
          {item.isFeatured ? (
            <span className="nm-badge-premium">
              <Crown size={11} /> Premium
            </span>
          ) : null}
          {trusted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/92 px-2 py-1 text-[10px] font-black text-emerald-800 shadow-sm backdrop-blur dark:bg-emerald-950/85 dark:text-emerald-200">
              <ShieldCheck size={11} /> Doğrulanmış
            </span>
          ) : null}
        </div>

        {photoCount > 1 ? (
          <span className="absolute bottom-[5.5rem] right-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-sm">
            {photoCount} foto
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/75">{categoryLabel(item)}</div>
          <h3 className="mt-1 line-clamp-2 text-base font-black leading-5">{item.title}</h3>
          <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-white/85">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{item.location || 'Konum belirtilmemiş'}</span>
          </div>
          <div className="mt-2 text-2xl font-black leading-none tracking-tight">{priceLabel}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[var(--field-border)] bg-[var(--surface)] px-4 py-3 text-[11px] font-bold text-slate-500 dark:border-white/10 dark:text-slate-400">
        <span className="inline-flex min-w-0 items-center gap-1 truncate">
          <Clock size={12} className="shrink-0" />
          {freshness}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1">
          <Eye size={12} />
          {Number(item.views || item.view_count || 0).toLocaleString('tr-TR')}
        </span>
      </div>
    </article>
  );
}
