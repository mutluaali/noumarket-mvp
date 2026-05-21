'use client';

import { useEffect, useState } from 'react';
import { X, Heart } from 'lucide-react';
import { getFavoriteListings, removeFavorite } from '@/lib/favorites';
import { normalizeListing } from '@/lib/listings';
import ListingCard from '@/components/ListingCard';

export default function FavoritesModal({ user, onClose, onOpenListing }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadFavorites() {
    if (!user?.id) return;
    setLoading(true);

    try {
      const rows = await getFavoriteListings(user.id);
      setItems(rows.map(normalizeListing));
    } catch (error) {
      alert(error.message || 'Favoriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites();
  }, [user?.id]);

  async function handleRemove(listingId) {
    try {
      await removeFavorite(user.id, listingId);
      setItems((current) => current.filter((item) => item.id !== listingId));
    } catch (error) {
      alert(error.message || 'Favoriden kaldırılamadı.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-6xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-rose-600">
              <Heart size={16} /> Favorilerim
            </div>
            <h2 className="mt-1 text-2xl font-black">Kaydettiğin ilanlar</h2>
            <p className="mt-1 text-sm text-slate-500">
              Beğendiğin ilanları buradan takip edebilirsin.
            </p>
          </div>

          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">Favoriler yükleniyor...</p>}

        {!loading && items.length === 0 && (
          <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Henüz favori ilan yok.
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <ListingCard item={item} onClick={() => onOpenListing?.(item)} />
              <button
                onClick={() => handleRemove(item.id)}
                className="absolute bottom-4 right-4 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-rose-600 shadow-sm ring-1 ring-rose-100"
              >
                Favoriden çıkar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
