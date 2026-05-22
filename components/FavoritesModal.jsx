'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Heart, MapPin, RefreshCw } from 'lucide-react';
import { getFavoriteListings } from '@/lib/favorites';

function getListingImage(item) {
  if (item?.image_url) return item.image_url;

  if (Array.isArray(item?.listing_images) && item.listing_images.length > 0) {
    return item.listing_images[0]?.image_url || '';
  }

  return '';
}

function formatPrice(item) {
  if (item?.price === null || item?.price === undefined || item?.price === '') {
    return 'Görüşülür';
  }

  const amount = Number(item.price);
  if (Number.isNaN(amount)) return 'Görüşülür';

  return `${amount.toLocaleString('fr-FR')} ${item.currency || 'XPF'}`;
}

export default function FavoritesModal({ onClose }) {
  const mountedRef = useRef(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  async function loadFavorites() {
    setLoading(true);
    setErrorText('');

    try {
      const rows = await getFavoriteListings();

      if (!mountedRef.current) return;

      setItems(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error('FavoritesModal load error:', error);

      if (!mountedRef.current) return;

      setItems([]);
      setErrorText(error?.message || 'Favoriler yüklenemedi.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    loadFavorites();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-6xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 text-sm font-bold text-rose-600">
              <Heart size={16} /> Favorilerim
            </div>
            <h2 className="text-2xl font-black">Favori ilanların</h2>
            <p className="mt-1 text-sm text-slate-500">
              Kaydettiğin ilanlar burada görünür.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadFavorites}
              disabled={loading}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw size={15} /> Yenile
              </span>
            </button>

            <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
              <X />
            </button>
          </div>
        </div>

        {loading && (
          <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Favorilerin yükleniyor...
          </div>
        )}

        {!loading && errorText && (
          <div className="rounded-3xl bg-red-50 p-6 text-sm font-semibold text-red-700 ring-1 ring-red-100">
            {errorText}
          </div>
        )}

        {!loading && !errorText && items.length === 0 && (
          <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Henüz favori ilan yok.
          </div>
        )}

        {!loading && !errorText && items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const image = getListingImage(item);

              return (
                <div key={item.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                  <div className="relative h-48 bg-slate-100">
                    {image ? (
                      <img src={image} alt={item.title || 'Favori ilan'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Görsel yok
                      </div>
                    )}

                    <div className="absolute right-3 top-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-black text-white">
                      Favori
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      {item.category || 'Kategori'}
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-lg font-black text-slate-950">
                      {item.title || 'Başlıksız ilan'}
                    </h3>

                    <p className="mt-2 text-xl font-black text-slate-950">
                      {formatPrice(item)}
                    </p>

                    <p className="mt-3 flex items-center gap-1 text-sm text-slate-500">
                      <MapPin size={15} />
                      {item.location || 'Konum yok'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
