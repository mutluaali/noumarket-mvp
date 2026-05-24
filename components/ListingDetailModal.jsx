'use client';

import { X, MapPin, Clock, ShieldCheck, Flag, MessageCircle, Heart, Share2, Eye, Crown, ChevronRight } from 'lucide-react';
import { formatXpf } from '@/lib/demoData';

function AttributeGrid({ attributes }) {
  const entries = Object.entries(attributes || {}).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return null;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-lg font-black">İlan Özellikleri</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">{key}</div>
            <div className="mt-1 text-sm font-black text-slate-800">{String(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ListingDetailModal({ selected, onClose, onStartChat }) {
  if (!selected) return null;
  const images = selected.images?.length ? selected.images : [selected.image, selected.image_url].filter(Boolean);
  const mainImage = images[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80';
  const trustScore = Number(selected.trustScore || selected.trust_score || 70);
  const categoryTrail = selected.category_label || selected.category || 'İlan';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 p-2 backdrop-blur-sm md:p-6">
      <div className="mx-auto max-h-[96vh] max-w-7xl overflow-hidden rounded-3xl bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1 truncate text-xs font-bold text-slate-500">
              {categoryTrail.split('>').map((x, i) => <span key={`${x}-${i}`} className="inline-flex items-center gap-1 truncate">{i > 0 && <ChevronRight size={12}/>} {x.trim()}</span>)}
            </div>
            <h2 className="truncate text-lg font-black text-slate-950 md:text-xl">{selected.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-slate-100 p-2 hover:bg-slate-200"><X size={20}/></button>
        </div>

        <div className="grid max-h-[calc(96vh-73px)] overflow-y-auto lg:grid-cols-[1fr_370px]">
          <main className="space-y-4 p-4 md:p-5">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <img src={mainImage} alt={selected.title} className="h-[280px] w-full object-cover md:h-[500px]" />
              {images.length > 1 && <div className="flex gap-2 overflow-x-auto p-3">{images.slice(1, 6).map((img, i)=><img key={i} src={img} alt="" className="h-20 w-28 rounded-2xl object-cover ring-1 ring-slate-200"/> )}</div>}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  {selected.isFeatured && <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700"><Crown size={13}/> Premium</span>}
                  <h1 className="text-2xl font-black text-slate-950 md:text-3xl">{selected.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
                    <span className="inline-flex items-center gap-1"><MapPin size={15}/> {selected.location || 'Konum yok'}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={15}/> {selected.createdAt || selected.created_at || 'Yeni'}</span>
                    <span className="inline-flex items-center gap-1"><Eye size={15}/> {selected.views || 0} görüntülenme</span>
                  </div>
                </div>
                <div className="text-right"><div className="text-3xl font-black text-blue-600">{formatXpf ? formatXpf(selected.price) : selected.price}</div><div className="text-xs font-bold text-slate-400">Pazarlık satıcıya bağlı</div></div>
              </div>
            </div>

            <AttributeGrid attributes={selected.attributes} />

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-lg font-black">Açıklama</h3>
              <p className="whitespace-pre-line text-sm leading-7 text-slate-600">{selected.description || 'Bu ilan için açıklama girilmemiş.'}</p>
            </div>
          </main>

          <aside className="space-y-4 border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0 md:p-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-xl font-black shadow-sm">{(selected.sellerName || selected.seller_name || 'N')[0]}</div>
                <div>
                  <div className="font-black">{selected.sellerName || selected.seller_name || 'Satıcı'}</div>
                  <div className="text-xs font-bold text-slate-500">Doğrulanmış satıcı profili</div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                <div className="mb-2 flex items-center justify-between text-xs font-black"><span>Güven skoru</span><span>{trustScore}/100</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(5, Math.min(trustScore, 100))}%` }} /></div>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-800 ring-1 ring-emerald-100"><ShieldCheck size={16} className="mt-0.5 shrink-0"/> Güvenlik için ödeme yapmadan önce ürünü/evrakı kontrol et. Platform dışı kapora isteyenlere dikkat et.</div>
            </div>

            <button onClick={onStartChat} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><MessageCircle size={18}/> Satıcıya mesaj gönder</button>
            <div className="grid grid-cols-3 gap-2">
              <button className="rounded-2xl bg-slate-100 py-3 text-xs font-black hover:bg-slate-200"><Heart className="mx-auto mb-1" size={17}/>Favori</button>
              <button className="rounded-2xl bg-slate-100 py-3 text-xs font-black hover:bg-slate-200"><Share2 className="mx-auto mb-1" size={17}/>Paylaş</button>
              <button className="rounded-2xl bg-rose-50 py-3 text-xs font-black text-rose-700 hover:bg-rose-100"><Flag className="mx-auto mb-1" size={17}/>Şikayet</button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="font-black">Benzer ilanlar alanı</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Bir sonraki aşamada aynı kategori + aynı konum + yakın fiyat mantığıyla öneri motoru bağlanacak.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
