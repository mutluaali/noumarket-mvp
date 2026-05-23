'use client';

import { Car, Home, Ship, Smartphone, Sofa, BriefcaseBusiness, Wrench, PawPrint, Boxes } from 'lucide-react';
import { categories } from '@/lib/categories';

const iconMap = {
  Araç: Car,
  Emlak: Home,
  Denizcilik: Ship,
  Elektronik: Smartphone,
  'Ev & Yaşam': Sofa,
  'İş / Hizmet': BriefcaseBusiness,
  'Yedek Parça': Wrench,
  Hayvanlar: PawPrint,
  Diğer: Boxes,
};

export default function CategoryShowcase({ activeCategory, counts = {}, onSelect }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Kategoriler</h2>
          <p className="mt-1 text-sm text-slate-500">Sahibinden mantığında hızlı kategori girişi.</p>
        </div>
        <button
          onClick={() => onSelect?.('Tümü')}
          className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm sm:block"
        >
          Tüm ilanlar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
        {categories.map((category) => {
          const Icon = iconMap[category] || Boxes;
          const active = activeCategory === category;

          return (
            <button
              key={category}
              onClick={() => onSelect?.(category)}
              className={`group rounded-3xl p-4 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-lg ${
                active
                  ? 'bg-slate-900 text-white ring-slate-900'
                  : 'bg-white text-slate-900 ring-slate-200'
              }`}
            >
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-white/15' : 'bg-slate-100 group-hover:bg-slate-900 group-hover:text-white'}`}>
                <Icon size={21} />
              </div>
              <div className="text-sm font-black leading-tight">{category}</div>
              <div className={`mt-1 text-xs ${active ? 'text-white/70' : 'text-slate-500'}`}>
                {counts[category] || 0} ilan
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
