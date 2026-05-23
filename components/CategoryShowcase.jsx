'use client';

import { Car, Home, Ship, Smartphone, Sofa, BriefcaseBusiness, Wrench, PawPrint, Boxes, ChevronRight } from 'lucide-react';
import { categoryTree } from '@/lib/categories';

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

export default function CategoryShowcase({ activeCategory, activeSubcategory, counts = {}, onSelect, onSelectSubcategory }) {
  const selected = categoryTree.find((item) => item.name === activeCategory) || categoryTree[0];

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Kategoriler</h2>
          <p className="mt-1 text-sm text-slate-500">Ana kategori ve alt kategorilerle ilanlara hızlı gir.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect?.('Tümü');
            onSelectSubcategory?.('Tümü');
          }}
          className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50 sm:block"
        >
          Tüm ilanlar
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          {categoryTree.map((category) => {
            const Icon = iconMap[category.name] || Boxes;
            const active = activeCategory === category.name;

            return (
              <button
                key={category.name}
                type="button"
                onClick={() => {
                  onSelect?.(category.name);
                  onSelectSubcategory?.('Tümü');
                }}
                className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${
                  active ? 'bg-slate-950 text-white' : 'bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-white/15' : 'bg-slate-100'}`}>
                  <Icon size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">{category.name}</span>
                  <span className={`block text-xs font-semibold ${active ? 'text-white/70' : 'text-slate-500'}`}>{counts[category.name] || 0} ilan</span>
                </span>
                <ChevronRight size={16} className={active ? 'text-white/70' : 'text-slate-400'} />
              </button>
            );
          })}
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-black text-slate-950">{activeCategory === 'Tümü' ? 'Popüler alt kategoriler' : selected?.name}</div>
              <div className="text-sm text-slate-500">Sahibinden tarzı net ve hızlı kategori akışı.</div>
            </div>
            {activeSubcategory && activeSubcategory !== 'Tümü' && (
              <button type="button" onClick={() => onSelectSubcategory?.('Tümü')} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200">
                Alt filtreyi temizle
              </button>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {(activeCategory === 'Tümü' ? categoryTree.flatMap((item) => item.subcategories.slice(0, 3).map((sub) => ({ parent: item.name, name: sub }))) : (selected?.subcategories || []).map((sub) => ({ parent: selected.name, name: sub }))).map((subcategory) => {
              const active = activeSubcategory === subcategory.name;
              return (
                <button
                  key={`${subcategory.parent}-${subcategory.name}`}
                  type="button"
                  onClick={() => {
                    onSelect?.(subcategory.parent);
                    onSelectSubcategory?.(subcategory.name);
                  }}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold ring-1 transition ${
                    active ? 'bg-blue-600 text-white ring-blue-600' : 'bg-slate-50 text-slate-700 ring-slate-200 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <span className="truncate">{subcategory.name}</span>
                  <span className={active ? 'text-white/70' : 'text-slate-400'}>→</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
