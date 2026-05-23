'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, BellOff, Bookmark, Search, Trash2, X } from 'lucide-react';
import {
  deleteSavedSearch,
  getSavedSearches,
  updateSavedSearchNotification,
} from '@/lib/savedSearches';

function priceRangeText(item) {
  if (!item?.min_price && !item?.max_price) return 'Fiyat filtresi yok';
  const min = item.min_price ? `${Number(item.min_price).toLocaleString('tr-TR')} XPF` : '0 XPF';
  const max = item.max_price ? `${Number(item.max_price).toLocaleString('tr-TR')} XPF` : '∞';
  return `${min} - ${max}`;
}

export default function SavedSearchesModal({ user, onClose, onApply }) {
  const mountedRef = useRef(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  const activeCount = useMemo(
    () => items.filter((item) => item.notify_new_matches).length,
    [items]
  );

  async function load() {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText('');

    try {
      const rows = await getSavedSearches(user.id);
      if (!mountedRef.current) return;
      setItems(rows);
    } catch (error) {
      console.error('SavedSearchesModal load error:', error);
      if (!mountedRef.current) return;
      setItems([]);
      setErrorText(error.message || 'Kayıtlı aramalar yüklenemedi. SQL dosyasını çalıştırdığından emin ol.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [user?.id]);

  async function handleDelete(id) {
    if (!confirm('Bu kayıtlı arama silinsin mi?')) return;

    try {
      await deleteSavedSearch(id, user.id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      alert(error.message || 'Kayıtlı arama silinemedi.');
    }
  }

  async function handleToggle(item) {
    try {
      const next = await updateSavedSearchNotification(
        item.id,
        user.id,
        !item.notify_new_matches
      );
      setItems((current) => current.map((row) => (row.id === item.id ? next : row)));
    } catch (error) {
      alert(error.message || 'Bildirim tercihi güncellenemedi.');
    }
  }

  function apply(item) {
    onApply?.({
      query: item.query || '',
      category: item.category || 'Tümü',
      location: item.location || 'Tümü',
      minPrice: item.min_price ? String(item.min_price) : '',
      maxPrice: item.max_price ? String(item.max_price) : '',
      sort: item.sort || 'newest',
    });
    onClose?.();
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-4xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 text-sm font-bold text-slate-500">
              <Bookmark size={16} /> Kayıtlı aramalar
            </div>
            <h2 className="text-2xl font-black">Arama alarm merkezi</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sık baktığın filtreleri kaydet. Yeni eşleşen ilanlar için bildirim altyapısı hazır.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>

        <div className="mb-5 rounded-3xl bg-slate-950 p-5 text-white">
          <div className="text-sm font-semibold text-slate-300">Aktif alarm</div>
          <div className="mt-1 text-3xl font-black">{activeCount}</div>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Bu ekran retention için kritik. Kullanıcı aramasını kaydederse platforma geri dönme ihtimali yükselir.
          </p>
        </div>

        {loading && (
          <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Kayıtlı aramalar yükleniyor...
          </div>
        )}

        {!loading && errorText && (
          <div className="rounded-3xl bg-red-50 p-6 text-sm font-semibold text-red-700 ring-1 ring-red-100">
            {errorText}
          </div>
        )}

        {!loading && !errorText && items.length === 0 && (
          <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Henüz kayıtlı araman yok. Ana sayfada filtre seçip “Aramayı kaydet” butonuna bas.
          </div>
        )}

        {!loading && !errorText && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-black text-slate-950">{item.name || 'Kayıtlı arama'}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                      <span className="rounded-full bg-slate-100 px-3 py-1">{item.category || 'Tümü'}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">{item.location || 'Tümü'}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">{priceRangeText(item)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => apply(item)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white"
                    >
                      <Search size={15} /> Uygula
                    </button>
                    <button
                      onClick={() => handleToggle(item)}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold ring-1 ${
                        item.notify_new_matches
                          ? 'bg-sky-50 text-sky-700 ring-sky-100'
                          : 'bg-slate-50 text-slate-600 ring-slate-200'
                      }`}
                    >
                      {item.notify_new_matches ? <Bell size={15} /> : <BellOff size={15} />}
                      {item.notify_new_matches ? 'Alarm açık' : 'Alarm kapalı'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 ring-1 ring-red-100"
                    >
                      <Trash2 size={15} /> Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
