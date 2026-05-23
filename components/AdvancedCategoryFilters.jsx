'use client';

import { SlidersHorizontal } from 'lucide-react';

const filtersByCategory = {
  Araç: ['Marka', 'Model', 'Yıl', 'Kilometre', 'Vites', 'Yakıt'],
  Emlak: ['Oda', 'm²', 'Eşyalı', 'Kat', 'Depozito'],
  Elektronik: ['Marka', 'Model', 'Garanti', 'Hafıza', 'Kozmetik'],
  Denizcilik: ['Marka', 'Boy', 'Motor saati', 'Yakıt', 'Yıl'],
};

export default function AdvancedCategoryFilters({ category, onSuggest }) {
  const fields = filtersByCategory[category] || [];
  if (!fields.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-3">
      <div className="rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-black text-slate-950"><SlidersHorizontal size={17}/> {category} için akıllı filtreler</div>
            <p className="mt-1 text-xs font-semibold text-slate-500">Sahibinden mantığında her kategori aynı filtreyle aranmaz. Bu alan sonraki sürümde gerçek metadata filtrelerine bağlanacak.</p>
          </div>
          <button onClick={onSuggest} className="hidden rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white md:block">Filtre yapısını geliştir</button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fields.map((field) => (
            <span key={field} className="whitespace-nowrap rounded-2xl bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200">{field}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
