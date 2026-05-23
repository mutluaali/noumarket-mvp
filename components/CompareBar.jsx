'use client';

import { GitCompareArrows, X } from 'lucide-react';

export default function CompareBar({ items = [], onOpen, onRemove, onClear }) {
  if (!items.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-4 lg:bottom-5">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 rounded-[1.7rem] border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white md:flex">
            <GitCompareArrows size={19} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-950">Karşılaştırma listesi</div>
            <div className="text-xs font-semibold text-slate-500">{items.length}/4 ilan seçildi. Fiyat, konum, kategori ve temel özellikleri yan yana gör.</div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto md:justify-end">
          {items.map((item) => (
            <div key={item.id} className="flex min-w-[180px] items-center gap-2 rounded-2xl bg-slate-50 p-2 ring-1 ring-slate-200">
              <img src={item.image} alt="" className="h-10 w-10 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-black text-slate-900">{item.title}</div>
                <div className="truncate text-[11px] font-bold text-slate-500">{item.priceText}</div>
              </div>
              <button onClick={() => onRemove?.(item.id)} className="rounded-full bg-white p-1 text-slate-500 hover:text-rose-600" aria-label="Karşılaştırmadan çıkar">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 md:flex">
          <button onClick={onClear} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Temizle</button>
          <button onClick={onOpen} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm">Karşılaştır</button>
        </div>
      </div>
    </div>
  );
}
