'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, X } from 'lucide-react';
import ListingCard from '@/components/ListingCard';
import { clearRecentlyViewedIds, getRecentlyViewedIds } from '@/lib/recentlyViewed';

export default function RecentlyViewed({ listings = [], onOpen, onFavorite, favoriteIds = [] }) {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    setIds(getRecentlyViewedIds());

    function handleUpdate(event) {
      setIds(Array.isArray(event.detail) ? event.detail : getRecentlyViewedIds());
    }

    window.addEventListener('noumarket:recently-viewed-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('noumarket:recently-viewed-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const items = useMemo(() => {
    const byId = new Map(listings.map((item) => [String(item.id), item]));
    return ids.map((id) => byId.get(String(id))).filter(Boolean).slice(0, 6);
  }, [ids, listings]);

  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
            <Clock size={14} /> Son baktıkların
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Kaldığın yerden devam et</h2>
        </div>
        <button
          onClick={() => {
            clearRecentlyViewedIds();
            setIds([]);
          }}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-100"
        >
          <X size={14} /> Temizle
        </button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ListingCard
            key={item.id}
            item={item}
            onClick={() => onOpen?.(item)}
            onFavorite={onFavorite}
            isFavorite={favoriteIds.includes(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
