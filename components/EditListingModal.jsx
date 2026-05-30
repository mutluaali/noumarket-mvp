'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ImagePlus, Save, X } from 'lucide-react';
import { updateMyListing } from '@/lib/myListings';

const categories = ['Araç', 'Emlak', 'Denizcilik', 'Elektronik', 'Ev Eşyası', 'İş / Hizmet'];

const labelClass = 'mb-1 block text-xs font-black text-slate-500';
const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500';

function RequiredLabel({ children }) {
  return (
    <span className={labelClass}>
      {children} <span className="text-rose-500" aria-hidden="true">*</span>
    </span>
  );
}

function formatNumberInput(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('tr-TR');
}

function parseNumberInput(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? Number(digits) : null;
}

export default function EditListingModal({ listing, user, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
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

  const status = String(listing?.status || '').toLowerCase();
  const isRejected = status === 'rejected';
  const rejectionReason = listing?.rejected_reason || '';

  useEffect(() => {
    if (!listing) return;

    setForm({
      title: listing.title || '',
      category: listing.category || 'Araç',
      subcategory: listing.subcategory || '',
      condition: listing.condition || 'used',
      price: listing.price ? formatNumberInput(String(listing.price)) : '',
      location: listing.location || '',
      seller_name: listing.seller || listing.seller_name || '',
      seller_phone: listing.phone || listing.seller_phone || '',
      seller_email: listing.email || listing.seller_email || user?.email || '',
      image_url: listing.image || listing.image_url || listing.images?.[0] || '',
      description: listing.description || '',
    });
    setFieldErrors({});
    setSubmitError('');
  }, [listing, user?.email]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: '' }));
    setSubmitError('');
  }

  async function submit(e) {
    e.preventDefault();

    if (!user?.id) {
      setSubmitError('Düzenleme yapmak için giriş yapmalısın.');
      return;
    }

    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'İlan başlığı zorunludur.';
    if (!form.location.trim()) nextErrors.location = 'Konum zorunludur.';
    if (!form.seller_name.trim()) nextErrors.seller_name = 'Satıcı adı zorunludur.';
    if (!form.seller_phone.trim()) nextErrors.seller_phone = 'Telefon zorunludur.';
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      await updateMyListing({
        id: listing.id,
        userId: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        subcategory: form.subcategory.trim(),
        condition: form.condition,
        price: parseNumberInput(form.price),
        location: form.location.trim(),
        seller_name: form.seller_name.trim(),
        seller_phone: form.seller_phone.trim(),
        seller_email: form.seller_email.trim(),
        image_url: form.image_url.trim(),
      });

      onUpdated?.();
      onClose?.();
    } catch (error) {
      setSubmitError(error.message || 'İlan güncellenemedi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/60 p-0 backdrop-blur-sm sm:p-4" onClick={() => onClose?.()}>
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        className="mx-auto flex h-[100dvh] max-w-3xl flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[94dvh] sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-xl font-black sm:text-2xl">İlanı düzenle</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Değişikliklerden sonra ilan tekrar onaya gönderilebilir.
            </p>
          </div>
          <button type="button" onClick={() => onClose?.()} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {isRejected ? (
            <section className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
              <div className="flex items-start gap-2 font-black">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                Bu ilan reddedildi
              </div>
              {rejectionReason ? (
                <p className="mt-2">
                  <span className="font-black">Red nedeni:</span> {rejectionReason}
                </p>
              ) : (
                <p className="mt-2">Red nedeni belirtilmemiş. Düzenleyip tekrar gönderebilirsin.</p>
              )}
            </section>
          ) : (
            <section className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-950">
              Kaydettiğinde ilan <strong>Onay bekliyor</strong> durumuna döner ve tekrar incelenir.
            </section>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <RequiredLabel>İlan başlığı</RequiredLabel>
              <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Örn: Satılık iPhone 14 Pro" className={inputClass} />
              {fieldErrors.title ? <p className="mt-1 text-xs font-bold text-rose-600">{fieldErrors.title}</p> : null}
            </label>

            <label>
              <RequiredLabel>Kategori</RequiredLabel>
              <select value={form.category} onChange={(e) => update('category', e.target.value)} className={inputClass}>
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              <span className={labelClass}>Alt kategori</span>
              <input value={form.subcategory} onChange={(e) => update('subcategory', e.target.value)} placeholder="Örn: Sedan, Daire" className={inputClass} />
            </label>

            <label>
              <span className={labelClass}>Durum</span>
              <select value={form.condition} onChange={(e) => update('condition', e.target.value)} className={inputClass}>
                <option value="new">Yeni</option>
                <option value="like_new">Yeni gibi</option>
                <option value="used">Kullanılmış</option>
                <option value="damaged">Hasarlı</option>
              </select>
            </label>

            <label>
              <RequiredLabel>Fiyat</RequiredLabel>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => update('price', formatNumberInput(e.target.value))}
                  placeholder="875.000"
                  className={`${inputClass} pr-14`}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-black text-slate-400">XPF</span>
              </div>
            </label>

            <label className="md:col-span-2">
              <RequiredLabel>Konum</RequiredLabel>
              <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Örn: Nouméa, Anse Vata" className={inputClass} />
              {fieldErrors.location ? <p className="mt-1 text-xs font-bold text-rose-600">{fieldErrors.location}</p> : null}
            </label>

            <label className="md:col-span-2">
              <span className={labelClass}>Açıklama</span>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Ürün veya hizmeti net anlat." rows={5} className={inputClass} />
            </label>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 font-black">
              <ImagePlus size={18} /> Kapak fotoğrafı
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Düzenlemede yeni dosya yükleme sınırlıdır. Mevcut kapak URL&apos;sini güncelleyebilirsin.
            </p>
            {form.image_url ? (
              <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-slate-200">
                <img src={form.image_url} alt="Kapak önizleme" className="aspect-[4/3] w-full max-w-xs object-cover" />
              </div>
            ) : (
              <div className="mt-3 flex aspect-[4/3] max-w-xs items-center justify-center rounded-xl bg-slate-200 text-xs font-bold text-slate-500">Fotoğraf yok</div>
            )}
            <input
              value={form.image_url}
              onChange={(e) => update('image_url', e.target.value)}
              placeholder="https:// görsel URL"
              className={`${inputClass} mt-3`}
            />
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 p-4">
            <h3 className="font-black">Satıcı bilgileri</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label>
                <RequiredLabel>Ad / mağaza</RequiredLabel>
                <input value={form.seller_name} onChange={(e) => update('seller_name', e.target.value)} className={inputClass} />
                {fieldErrors.seller_name ? <p className="mt-1 text-xs font-bold text-rose-600">{fieldErrors.seller_name}</p> : null}
              </label>
              <label>
                <RequiredLabel>Telefon</RequiredLabel>
                <input value={form.seller_phone} onChange={(e) => update('seller_phone', e.target.value)} placeholder="+687 ..." className={inputClass} />
                {fieldErrors.seller_phone ? <p className="mt-1 text-xs font-bold text-rose-600">{fieldErrors.seller_phone}</p> : null}
              </label>
              <label className="md:col-span-2">
                <span className={labelClass}>E-posta</span>
                <input value={form.seller_email} onChange={(e) => update('seller_email', e.target.value)} className={inputClass} />
              </label>
            </div>
          </section>

          {submitError ? (
            <div className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700 ring-1 ring-rose-200">{submitError}</div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:px-5">
          <button
            disabled={loading}
            type="submit"
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-5 py-4 text-sm font-black text-white hover:bg-cyan-800 disabled:opacity-60"
          >
            <Save size={17} /> {loading ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
