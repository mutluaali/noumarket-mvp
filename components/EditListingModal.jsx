'use client';

import { useEffect, useState } from 'react';
import { X, Save, Upload } from 'lucide-react';
import { updateMyListing } from '@/lib/myListings';

const categories = ['Araç', 'Emlak', 'Denizcilik', 'Elektronik', 'Ev Eşyası', 'İş / Hizmet'];

export default function EditListingModal({ listing, user, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Araç',
    subcategory: '',
    condition: 'used',
    price: '',
    location: '',
    seller_name: '',
    seller_phone: '',
    seller_email: '',
    image_url: '',
    description: '',
  });

  useEffect(() => {
    if (!listing) return;

    setForm({
      title: listing.title || '',
      category: listing.category || 'Araç',
      subcategory: listing.subcategory || '',
      condition: listing.condition || 'used',
      price: listing.price ? String(listing.price) : '',
      location: listing.location || '',
      seller_name: listing.seller || listing.seller_name || '',
      seller_phone: listing.phone || listing.seller_phone || '',
      seller_email: listing.email || listing.seller_email || user?.email || '',
      image_url: listing.image || listing.image_url || '',
      description: listing.description || '',
    });
  }, [listing, user?.email]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();

    if (!user?.id) {
      alert('Düzenleme yapmak için giriş yapmalısın.');
      return;
    }

    setLoading(true);

    try {
      await updateMyListing({
        id: listing.id,
        userId: user.id,
        ...form,
      });

      alert('İlan güncellendi. Güvenlik için tekrar admin onayına gönderildi.');
      onUpdated?.();
      onClose?.();
    } catch (error) {
      alert(error.message || 'İlan güncellenemedi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/60 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="mx-auto max-h-[92vh] max-w-3xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">İlanı düzenle</h2>
            <p className="mt-1 text-sm text-slate-500">
              Düzenlenen ilan tekrar admin onayına düşer.
            </p>
          </div>

          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="İlan başlığı"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2"
          />

          <select
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          >
            {categories.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>

          <input
            value={form.subcategory}
            onChange={(e) => update('subcategory', e.target.value)}
            placeholder="Alt kategori"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />

          <select
            value={form.condition}
            onChange={(e) => update('condition', e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          >
            <option value="new">Yeni</option>
            <option value="like_new">Yeni gibi</option>
            <option value="used">Kullanılmış</option>
            <option value="damaged">Hasarlı</option>
          </select>

          <input
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            type="number"
            placeholder="Fiyat / XPF"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />

          <input
            required
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Konum"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />

          <input
            required
            value={form.seller_name}
            onChange={(e) => update('seller_name', e.target.value)}
            placeholder="Satıcı adı"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />

          <input
            required
            value={form.seller_phone}
            onChange={(e) => update('seller_phone', e.target.value)}
            placeholder="Telefon"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />

          <input
            value={form.seller_email}
            onChange={(e) => update('seller_email', e.target.value)}
            placeholder="E-posta"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />

          <input
            value={form.image_url}
            onChange={(e) => update('image_url', e.target.value)}
            placeholder="Kapak fotoğraf URL"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2"
          />

          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Açıklama"
            rows={4}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
        >
          <Save size={17} /> {loading ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
        </button>
      </form>
    </div>
  );
}
