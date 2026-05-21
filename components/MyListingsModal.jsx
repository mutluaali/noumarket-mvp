'use client';

import { useEffect, useState } from 'react';
import { X, RefreshCw, Trash2, Pencil, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMyListings, deleteMyListing } from '@/lib/myListings';
import { normalizeListing } from '@/lib/listings';
import ListingCard from '@/components/ListingCard';
import EditListingModal from '@/components/EditListingModal';

function statusLabel(status) {
  if (status === 'approved') return 'Yayında';
  if (status === 'pending') return 'Onay bekliyor';
  if (status === 'rejected') return 'Reddedildi';
  return status || 'Bilinmiyor';
}

function statusClass(status) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status === 'pending') return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (status === 'rejected') return 'bg-red-50 text-red-700 ring-red-200';
  return 'bg-slate-50 text-slate-700 ring-slate-200';
}

function withTimeout(promise, ms, label = 'İşlem') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} zaman aşımına uğradı. Sayfayı yenileyip tekrar dene.`));
      }, ms);
    }),
  ]);
}

export default function MyListingsModal({ user, onClose }) {
  const [effectiveUser, setEffectiveUser] = useState(user || null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    setEffectiveUser(user || null);
  }, [user?.id]);

  async function resolveUser() {
    if (user?.id) return user;

    const sessionResult = await withTimeout(
      supabase.auth.getSession(),
      6000,
      'Oturum kontrolü'
    );

    if (sessionResult?.data?.session?.user) {
      return sessionResult.data.session.user;
    }

    const userResult = await withTimeout(
      supabase.auth.getUser(),
      6000,
      'Kullanıcı kontrolü'
    );

    if (userResult?.error) {
      console.error('getUser error:', userResult.error);
      return null;
    }

    return userResult?.data?.user || null;
  }

  async function load() {
    setLoading(true);
    setErrorText('');

    try {
      const currentUser = await resolveUser();
      setEffectiveUser(currentUser || null);

      if (!currentUser?.id) {
        setItems([]);
        setErrorText('Giriş oturumu bulunamadı. Lütfen sayfayı yenileyip tekrar giriş yap.');
        return;
      }

      const rows = await withTimeout(
        getMyListings(currentUser.id),
        10000,
        'İlan sorgusu'
      );

      setItems((rows || []).map(normalizeListing));
    } catch (error) {
      console.error('MyListingsModal load error:', error);
      setItems([]);
      setErrorText(error.message || 'İlanların yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function handleDelete(id) {
    const ok = confirm('Bu ilanı silmek istediğine emin misin?');
    if (!ok) return;

    try {
      await deleteMyListing(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      alert(error.message || 'İlan silinemedi.');
    }
  }

  async function handlePremium(item) {
    const currentUser = effectiveUser || user;

    if (!currentUser?.id) {
      alert('Premium satın almak için giriş yapmalısın.');
      return;
    }

    setPayingId(item.id);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: item.id,
          userId: currentUser.id,
          planId: 'premium_7',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout başlatılamadı.');
      }

      window.location.href = data.url;
    } catch (error) {
      alert(error.message || 'Premium ödeme başlatılamadı.');
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-6xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">İlanlarım</h2>
            <p className="mt-1 text-sm text-slate-500">
              Kendi ilanlarını görüntüle, düzenle, sil veya premium yap.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
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
          <p className="text-sm text-slate-500">İlanların yükleniyor...</p>
        )}

        {!loading && errorText && (
          <div className="rounded-3xl bg-red-50 p-5 text-sm font-semibold text-red-700 ring-1 ring-red-100">
            {errorText}
          </div>
        )}

        {!loading && !errorText && items.length === 0 && (
          <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Henüz ilan oluşturmamışsın.
          </div>
        )}

        {!loading && !errorText && items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="relative rounded-3xl bg-white">
                <ListingCard item={item} onClick={() => setEditing(item)} />

                <div className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-black ring-1 backdrop-blur-sm ${statusClass(item.status)}`}>
                  {statusLabel(item.status)}
                </div>

                <div className="absolute bottom-4 right-4 flex flex-wrap justify-end gap-2">
                  {item.status === 'approved' && !item.isFeatured && (
                    <button
                      onClick={() => handlePremium(item)}
                      disabled={payingId === item.id}
                      className="rounded-2xl bg-amber-500 px-3 py-2 text-xs font-black text-white shadow-sm ring-1 ring-amber-300 disabled:opacity-60"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Crown size={13} />
                        {payingId === item.id ? 'Yönlendiriliyor...' : 'Premium Yap'}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => setEditing(item)}
                    className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm ring-1 ring-slate-200"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Pencil size={13} /> Düzenle
                    </span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-red-600 shadow-sm ring-1 ring-red-100"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Trash2 size={13} /> Sil
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <EditListingModal
            user={effectiveUser || user}
            listing={editing}
            onClose={() => setEditing(null)}
            onUpdated={load}
          />
        )}
      </div>
    </div>
  );
}
