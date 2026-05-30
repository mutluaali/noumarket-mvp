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
      className="nm-card group flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] border ring-1 ring-slate-900/[0.04] transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:ring-white/10"
    >
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-slate-200 dark:bg-slate-800">
        {showFallback ? (
          <ListingImageFallback compact />
        ) : (
          <img
            src={imageUrl}
            alt={item.title || 'İlan görseli'}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/55 to-transparent" />

        {onFavorite ? (
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`absolute right-2.5 top-2.5 grid h-11 w-11 place-items-center rounded-full shadow-md backdrop-blur-md ring-1 transition active:scale-95 ${isFavorite ? 'bg-rose-500 text-white ring-rose-300' : 'bg-white/90 text-slate-700 ring-white/80 hover:bg-white dark:bg-slate-950/80 dark:text-white dark:ring-white/20'}`}
            aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
          </button>
        ) : null}

        <div className="absolute left-2.5 top-2.5 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1.5">
          {item.isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-950 shadow-md">
              <Crown size={11} /> Öne çıkan
            </span>
          ) : null}
          {trusted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/92 px-2 py-1 text-[10px] font-black text-emerald-800 shadow-sm backdrop-blur dark:bg-emerald-950/85 dark:text-emerald-200">
              <ShieldCheck size={11} /> Doğrulanmış
            </span>
          ) : null}
        </div>

        {photoCount > 1 ? (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-sm">
            {photoCount} foto
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">{categoryLabel(item)}</div>
        <div className="mt-1 text-xl font-black leading-none tracking-tight text-slate-950 dark:text-white sm:text-2xl">{priceLabel}</div>
        <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] text-[14px] font-bold leading-5 text-slate-800 dark:text-slate-100">{item.title}</h3>

        <div className="mt-auto pt-3">
          <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <MapPin size={13} className="shrink-0 text-cyan-600 dark:text-cyan-400" />
            <span className="truncate">{item.location || 'Konum belirtilmemiş'}</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] font-bold text-slate-500 dark:border-white/10 dark:text-slate-400">
            <span className="inline-flex min-w-0 items-center gap-1 truncate"><Clock size={12} className="shrink-0" />{freshness}</span>
            <span className="inline-flex shrink-0 items-center gap-1"><Eye size={12} />{Number(item.views || item.view_count || 0).toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
