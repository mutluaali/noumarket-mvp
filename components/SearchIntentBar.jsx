'use client';

import { Bot, Sparkles } from 'lucide-react';

const examples = [
  'Nouméa içinde 100 bin XPF altı iPhone',
  'Dizel otomatik araç 1.5M XPF altı',
  'Denize yakın kiralık ev',
  'Tekne motoru ve denizcilik ekipmanı',
];

export default function SearchIntentBar({ query, setQuery, onSearch }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-3">
      <div className="rounded-[2rem] border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white"><Bot size={20} /></div>
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-slate-950"><Sparkles size={15} /> Akıllı arama denemesi</div>
              <p className="mt-1 text-sm leading-6 text-slate-600">Filtre seçmek yerine doğal dilde yaz. NouMarket bunu başlık, açıklama, kategori ve lokasyon içinde arar.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {examples.map((example) => (
              <button
                key={example}
                onClick={() => {
                  setQuery(example);
                  setTimeout(() => onSearch?.(), 0);
                }}
                className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-950 hover:text-white"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
