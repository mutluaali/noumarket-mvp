'use client';

import { Bot, Sparkles, Wand2 } from 'lucide-react';
import { useMemo } from 'react';
import { parseSmartSearch } from '@/lib/smartSearch';

const examples = [
  'Nouméa içinde 100 bin XPF altı iPhone',
  'Dizel otomatik araç 1.5M XPF altı',
  'Denize yakın kiralık ev',
  'Tekne motoru ve denizcilik ekipmanı',
];

export default function SearchIntentBar({ query, setQuery, onSearch, onApplyIntent }) {
  const intent = useMemo(() => parseSmartSearch(query), [query]);

  function applySmart(value = query) {
    const parsed = parseSmartSearch(value);
    onApplyIntent?.(parsed);
    setTimeout(() => onSearch?.(), 0);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-3">
      <div className="rounded-[2rem] border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white"><Bot size={20} /></div>
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-slate-950"><Sparkles size={15} /> Akıllı arama denemesi</div>
              <p className="mt-1 text-sm leading-6 text-slate-600">Filtre seçmek yerine doğal dilde yaz. NouMarket kategori, konum, fiyat aralığı ve anahtar kelimeleri ayırıp filtrelere uygular.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:items-end">
            <button
              type="button"
              onClick={() => applySmart()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-slate-800"
            >
              <Wand2 size={14} /> Akıllı filtrele
            </button>
            {query?.trim() && intent.hints?.length ? (
              <div className="flex max-w-xl flex-wrap gap-1.5 lg:justify-end">
                {intent.hints.map((hint) => (
                  <span key={hint} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">{hint}</span>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2 lg:justify-end">
            {examples.map((example) => (
              <button
                key={example}
                onClick={() => {
                  setQuery(example);
                  applySmart(example);
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
    </div>
  );
}
