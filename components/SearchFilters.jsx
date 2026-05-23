'use client';

import { BookmarkPlus, SlidersHorizontal, Search, X } from 'lucide-react';
import { categoryOptions } from '@/lib/categories';

export default function SearchFilters({
  query,
  setQuery,
  category,
  setCategory,
  location,
  setLocation,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sort,
  setSort,
  locations = ['Tümü'],
  onSearch,
  onClear,
  onSaveSearch,
  compact = false,
  onCloseMobile,
}) {
  return (
    <section className={`mx-auto max-w-7xl px-4 py-4 ${compact ? 'hidden md:block' : 'fixed inset-0 z-50 overflow-auto bg-slate-950/45 py-10 backdrop-blur md:static md:block md:bg-transparent md:py-4 md:backdrop-blur-0'}`}> 
      <div className="mb-4 flex items-center justify-between gap-2 text-sm font-bold text-slate-700">
        <span className="inline-flex items-center gap-2"><SlidersHorizontal size={18} /> Detaylı arama</span>
        {!compact && <button onClick={onCloseMobile} className="rounded-full bg-white p-2 shadow-sm md:hidden"><X size={18} /></button>}
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-500">Sahibinden mantığı: kategori + fiyat + konum + sıralama; istersen seçtikçe otomatik, istersen Ara butonuyla sonuç getir.</div>
        <div className="grid gap-3 md:grid-cols-[1.3fr_0.8fr_0.8fr]">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3">
            <Search className="text-slate-500" size={20} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSearch?.();
              }}
              placeholder="Hilux, kiralık ev, iPhone, tekne..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          >
            {categoryOptions.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          >
            {locations.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <input
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            type="number"
            placeholder="Minimum fiyat / XPF"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          />

          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            type="number"
            placeholder="Maksimum fiyat / XPF"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          >
            <option value="newest">En yeni</option>
            <option value="popular">En popüler</option>
            <option value="price_low">Fiyat düşükten yükseğe</option>
            <option value="price_high">Fiyat yüksekten düşüğe</option>
          </select>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { onSearch?.(); onCloseMobile?.(); }}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white"
            >
              Ara
            </button>
            <button
              onClick={onSaveSearch}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 text-sm font-black text-sky-700 shadow-sm"
              title="Bu filtreleri kaydet"
            >
              <BookmarkPlus size={15} />
              Kaydet
            </button>
            <button
              onClick={() => { onClear?.(); onCloseMobile?.(); }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm"
            >
              Temizle
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
        {categoryOptions.map((x) => (
          <button
            key={x}
            onClick={() => {
              setCategory(x);
              setTimeout(() => onSearch?.(), 0);
            }}
            className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm ring-1 ${
              category === x
                ? 'bg-slate-900 text-white ring-slate-900'
                : 'bg-white text-slate-700 ring-slate-200'
            }`}
          >
            {x}
          </button>
        ))}
      </div>
    </section>
  );
}
