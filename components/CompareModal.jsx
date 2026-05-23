'use client';

import { Camera, Check, Crown, Eye, MapPin, MessageCircle, X } from 'lucide-react';

function imageCount(item) {
  if (Array.isArray(item?.images) && item.images.length) return item.images.length;
  return item?.image ? 1 : 0;
}

function metadataValue(item, key) {
  const value = item?.metadata?.[key] ?? item?.[key];
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

const rows = [
  ['Fiyat', (item) => item.priceText || '—'],
  ['Konum', (item) => item.location || '—'],
  ['Kategori', (item) => [item.category, item.subcategory].filter(Boolean).join(' / ') || '—'],
  ['Durum', (item) => item.condition || '—'],
  ['Fotoğraf', (item) => `${imageCount(item)} adet`],
  ['Görüntülenme', (item) => `${item.views || 0}`],
  ['Marka', (item) => metadataValue(item, 'brand')],
  ['Model', (item) => metadataValue(item, 'model')],
  ['Yıl', (item) => metadataValue(item, 'year')],
  ['Kilometre', (item) => metadataValue(item, 'mileage')],
  ['Oda', (item) => metadataValue(item, 'rooms')],
  ['m²', (item) => metadataValue(item, 'area')],
];

export default function CompareModal({ items = [], onClose, onOpenListing, onStartChat }) {
  return (
    <div className="fixed inset-0 z-[70] overflow-auto bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 max-w-7xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 p-5 backdrop-blur">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">Sahibinden tarzı karşılaştırma</div>
            <h2 className="mt-3 text-2xl font-black text-slate-950">İlan karşılaştır</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">En fazla 4 ilanı yan yana değerlendir. Özellikle araç, emlak ve elektronik seçiminde karar hızlanır.</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-3 text-slate-700 hover:bg-slate-200" aria-label="Kapat">
            <X size={22} />
          </button>
        </div>

        <div className="overflow-x-auto p-5">
          <div className="min-w-[920px]">
            <div className="grid gap-3" style={{ gridTemplateColumns: `180px repeat(${items.length}, minmax(190px, 1fr))` }}>
              <div />
              {items.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-[1.5rem] bg-slate-50 ring-1 ring-slate-200">
                  <div className="relative h-36 bg-slate-100">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    {item.isFeatured ? <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-[11px] font-black text-amber-950"><Crown size={12}/>Doping</span> : null}
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-black text-slate-950">{item.title}</h3>
                    <div className="mt-2 text-lg font-black text-slate-950">{item.priceText}</div>
                    <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-500"><MapPin size={13}/>{item.location || '—'}</div>
                    <button onClick={() => onOpenListing?.(item)} className="mt-3 w-full rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">İlana git</button>
                  </div>
                </div>
              ))}

              {rows.map(([label, getter]) => (
                <div key={label} className="contents">
                  <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">{label}</div>
                  {items.map((item) => (
                    <div key={`${item.id}-${label}`} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                      {getter(item)}
                    </div>
                  ))}
                </div>
              ))}

              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">Hızlı aksiyon</div>
              {items.map((item) => (
                <div key={`${item.id}-actions`} className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-2 ring-1 ring-slate-200">
                  <button onClick={() => onOpenListing?.(item)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-800 ring-1 ring-slate-200"><Eye size={13}/>Detay</button>
                  <button onClick={() => onStartChat?.(item)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white"><MessageCircle size={13}/>Yaz</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
          <Check className="mr-2 inline" size={16}/> Bu özellik kullanıcıyı sitede tutar: özellikle aynı model araçlar, benzer evler ve telefonlar arasında karar vermeyi kolaylaştırır.
        </div>
      </div>
    </div>
  );
}
