'use client';

import { Flame, Sparkles, TrendingUp } from 'lucide-react';
import ListingCard from '@/components/ListingCard';
import { buildSmartFeed, getTrendingListings } from '@/lib/smartFeed';

export default function SmartFeed({ listings = [], context = {}, favoriteIds = [], onFavorite, onOpen, onCompare, compareIds = [] }) {
  const personalized = buildSmartFeed(listings, { ...context, limit: 6 });
  const trending = getTrendingListings(listings, 3);

  if (!listings.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
              <Sparkles size={14} /> Akıllı feed
            </div>
            <h2 className="mt-3 text-2xl font-black text-slate-950">Sana göre öne çıkanlar</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Kategori, lokasyon, premium öncelik ve tazelik sinyallerine göre sıralandı.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 ring-1 ring-amber-200">
            <Flame size={17} /> {trending.length} trend ilan
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {personalized.map((item) => (
              <ListingCard
                key={`smart-${item.id}`}
                item={item}
                onClick={() => onOpen?.(item)}
                onFavorite={onFavorite}
                isFavorite={favoriteIds.includes(item.id)}
                onCompare={onCompare}
                isCompared={compareIds.includes(item.id)}
              />
            ))}
          </div>

          <aside className="rounded-[1.5rem] bg-slate-950 p-4 text-white">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-200">
              <TrendingUp size={17} /> Trend sinyalleri
            </div>
            <div className="space-y-3">
              {trending.map((item, index) => (
                <button
                  key={`trend-${item.id}`}
                  onClick={() => onOpen?.(item)}
                  className="w-full rounded-2xl bg-white/8 p-3 text-left transition hover:bg-white/14"
                >
                  <div className="text-xs font-black text-amber-200">#{index + 1} · {item.category}</div>
                  <div className="mt-1 line-clamp-1 text-sm font-black">{item.title}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-300">{item.views || 0} görüntülenme · {item.location}</div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
