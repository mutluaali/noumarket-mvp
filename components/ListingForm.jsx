'use client';

import { useMemo, useState } from 'react';
import { X, Upload, ImagePlus } from 'lucide-react';

const categories = ['Araç', 'Emlak', 'Denizcilik', 'Elektronik', 'Ev Eşyası', 'İş / Hizmet'];

export default function ListingForm({ onClose, onCreate }) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    title: '',
    category: 'Araç',
    price: '',
    location: 'Nouméa',
    seller_name: '',
    seller_phone: '',
    seller_email: '',
    image_url: '',
    description: '',
  });

  const previewUrl = useMemo(() => {
    if (!imageFile) return form.image_url || '';
    return URL.createObjectURL(imageFile);
  }, [imageFile, form.image_url]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate({ ...form, image_file: imageFile });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="mx-auto max-h-[92vh] max-w-3xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">Yeni ilan ekle</h2>
            <p className="mt-1 text-sm text-slate-500">Fotoğraf yükleyebilirsin. İlan admin onayından sonra yayına çıkar.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X /></button>
        </div>

        <div className="mb-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl bg-white p-5 text-center ring-1 ring-slate-200 hover:bg-slate-50">
            <ImagePlus className="mb-2 text-slate-500" size={30} />
            <div className="text-sm font-black text-slate-800">Fotoğraf seç</div>
            <div className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP veya GIF. Şimdilik tek fotoğraf.</div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  update('image_url', '');
                }
              }}
            />
          </label>

          {previewUrl && (
            <div className="mt-4 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <img src={previewUrl} alt="İlan önizleme" className="h-56 w-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="İlan başlığı" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
          <select value={form.category} onChange={(e) => update('category', e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
            {categories.map((x) => <option key={x}>{x}</option>)}
          </select>
          <input value={form.price} onChange={(e) => update('price', e.target.value)} type="number" placeholder="Fiyat / XPF" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
          <input required value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Konum" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
          <input required value={form.seller_name} onChange={(e) => update('seller_name', e.target.value)} placeholder="Satıcı adı" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
          <input required value={form.seller_phone} onChange={(e) => update('seller_phone', e.target.value)} placeholder="Telefon" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
          <input value={form.seller_email} onChange={(e) => update('seller_email', e.target.value)} placeholder="E-posta" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
          <input value={form.image_url} onChange={(e) => { setImageFile(null); update('image_url', e.target.value); }} placeholder="Alternatif: Fotoğraf URL" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Açıklama" rows={4} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none md:col-span-2" />
        </div>

        <button disabled={loading} type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60">
          <Upload size={17} /> {loading ? 'Kaydediliyor...' : 'İlanı Onaya Gönder'}
        </button>
      </form>
    </div>
  );
}
