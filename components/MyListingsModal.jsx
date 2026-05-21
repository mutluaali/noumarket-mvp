'use client';

import { useEffect, useState } from 'react';
import { X, RefreshCw, Trash2, Pencil, Crown } from 'lucide-react';
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

export default function MyListingsModal({ user, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [payingId, setPayingId] = useState(null);

  async function load() {
    // KRITIK FIX:
    // Production'da user geç gelirse loading sonsuz kalıyordu.
    if (!user?.id) {
      setLoading(false);
      setItems([]);
      return;
    }

    setLoading(true);

    try {
      const rows = await getMyListings(user.id);
      setItems((rows || []).map(normalizeListing));
    } catch (error) {
      console.error(error);
      alert(error.message || 'İlanların yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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
    if (!user?.id) {
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
          userId: user.id,
          plan: 'featured_7_days',
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
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw size={15} /> Yenile
              </span>
            </button>

            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-slate-100"
            >
              <X />
            </button>
          </div>
        </div>

        {loading && (
          <p className="text-sm text-slate-500">
            İlanların yükleniyor...
          </p>
        )}

        {!loading && items.length === 0 && (
          <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Henüz ilan oluşturmamışsın.
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="relative">
                <ListingCard listing={item} />

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setEditing(item)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Pencil size={15} /> Düzenle
                    </span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Trash2 size={15} /> Sil
                    </span>
                  </button>

                  {!item.is_featured && (
                    <button
                      disabled={payingId === item.id}
                      onClick={() => handlePremium(item)}
                      className="rounded-2xl bg-amber-400 px-4 py-2 text-sm font-black text-white"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Crown size={15} />
                        {payingId === item.id ? 'Yönlendiriliyor...' : 'Premium Yap'}
                      </span>
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClass(item.status)}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <EditListingModal
            listing={editing}
            onClose={() => setEditing(null)}
            onUpdated={() => {
              setEditing(null);
              load();
            }}
          />
        )}
      </div>
    </div>
  );
}
