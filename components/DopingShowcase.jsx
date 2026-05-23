'use client';

import { Crown, Megaphone, Star, Zap } from 'lucide-react';

const plans = [
  { icon: Crown, title: 'Ana sayfa vitrini', text: 'Seçili ilanı ana sayfada daha görünür yap.', price: '1.500 XPF' },
  { icon: Megaphone, title: 'Kategori vitrini', text: 'İlanı kendi kategori akışında üst sıraya taşı.', price: '1.200 XPF' },
  { icon: Zap, title: 'Arama üst sıra', text: 'Arama sonuçlarında premium öncelik ver.', price: '900 XPF' },
  { icon: Star, title: 'Kalın başlık', text: 'Liste görünümünde ilanı daha kolay fark ettir.', price: '500 XPF' },
];

export default function DopingShowcase({ onPricing }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-amber-200"><Crown size={14} /> Doping mantığı</div>
            <h2 className="mt-3 text-2xl font-black">Premium paketleri daha anlaşılır hale getirildi</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">Kullanıcı satacağı ürün için tam olarak ne satın aldığını görmeli: vitrin, kategori önceliği, arama üst sıra veya görsel vurgu.</p>
          </div>
          <button onClick={onPricing} className="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg">Paketleri aç</button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {plans.map(({ icon: Icon, title, text, price }) => (
            <div key={title} className="rounded-[1.5rem] bg-white/8 p-4 ring-1 ring-white/10">
              <Icon className="text-amber-300" size={22} />
              <h3 className="mt-3 font-black">{title}</h3>
              <p className="mt-1 min-h-[44px] text-sm leading-5 text-slate-300">{text}</p>
              <div className="mt-3 text-lg font-black text-white">{price}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
