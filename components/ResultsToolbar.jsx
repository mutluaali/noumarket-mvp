'use client';

import { Grid3X3, List, Rows3, SlidersHorizontal } from 'lucide-react';

const modes = [
  { key: 'gallery', label: 'Galeri', icon: Grid3X3 },
  { key: 'classic', label: 'Klasik', icon: Rows3 },
  { key: 'list', label: 'Liste', icon: List },
];

export default function ResultsToolbar({ count, viewMode, setViewMode, autoSearch, setAutoSearch, onOpenFilters }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 rounded-[1.5rem] bg-white p-3 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center">
      <div className="px-2">
        <div className="text-sm font-black text-slate-950">{count} ilan bulundu</div>
        <div className="text-xs font-semibold text-slate-500">Görünüm ve filtre davranışını buradan yönet.</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setAutoSearch(!autoSearch)}
          className={`rounded-2xl px-3 py-2 text-xs font-black ring-1 ${autoSearch ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-50 text-slate-600 ring-slate-200'}`}
        >
          Seçtikçe getir: {autoSearch ? 'Açık' : 'Kapalı'}
        </button>
        <button
          onClick={onOpenFilters}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white md:hidden"
        >
          <SlidersHorizontal size={15} /> Filtreler
        </button>
        <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1">
          {modes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-black ${viewMode === key ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
              title={label}
            >
              <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
