'use client';

import { useMemo, useState } from 'react';
import { Filter, Search, X, BookmarkPlus, SlidersHorizontal } from 'lucide-react';
import { CATEGORY_TREE } from '@/lib/categorySchema';

function FieldShell({ children, className = '' }) {
  return (
    <div className={`flex min-h-[48px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function FilterFields({
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
  locations,
}) {
  const categoryOptions = useMemo(() => ['Tümü', ...CATEGORY_TREE.map((item) => item.label)], []);

  return (
    <div className="grid gap-3 md:grid-cols-[1.2fr_0.9fr_0.9fr_0.7fr_0.7fr_0.9fr]">
      <FieldShell>
        <Search size={18} className="shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ne arıyorsun?"
          className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
        />
      </FieldShell>

      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 shadow-sm outline-none"
      >
        {categoryOptions.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>

      <select
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 shadow-sm outline-none"
      >
        {(locations?.length ? locations : ['Tümü']).map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>

      <input
        value={minPrice}
        onChange={(event) => setMinPrice(event.target.value)}
        inputMode="numeric"
        placeholder="Min XPF"
        className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm outline-none placeholder:text-slate-400"
      />

      <input
        value={maxPrice}
        onChange={(event) => setMaxPrice(event.target.value)}
        inputMode="numeric"
        placeholder="Max XPF"
        className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm outline-none placeholder:text-slate-400"
      />

      <select
        value={sort}
        onChange={(event) => setSort(event.target.value)}
        className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 shadow-sm outline-none"
      >
        <option value="newest">En yeni</option>
        <option value="price_asc">Fiyat artan</option>
        <option value="price_desc">Fiyat azalan</option>
        <option value="popular">Popüler</option>
      </select>
    </div>
  );
}

export default function SearchFilters(props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function runSearch() {
    props.onSearch?.();
    setMobileOpen(false);
  }

  function clearFilters() {
    props.onClear?.();
    setMobileOpen(false);
  }

  return (
    <section className="mt-4 scroll-mt-24">
      <div className="hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:block">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
          <SlidersHorizontal size={17} /> Filtrele
        </div>
        <FilterFields {...props} />
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Temizle
          </button>
          <button
            type="button"
            onClick={runSearch}
            className="rounded-2xl bg-slate-950 px-7 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
          >
            Ara
          </button>
        </div>
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25"
        >
          <Filter size={18} /> Filtrele ve ara
        </button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[100] md:hidden">
          <button
            type="button"
            aria-label="Filtreyi kapat"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
          />

          <div className="absolute inset-x-3 top-8 max-h-[calc(100vh-72px)] overflow-y-auto rounded-[28px] bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950">Filtrele</h3>
                <p className="mt-1 text-xs font-semibold text-slate-400">Arama kriterlerini seç, sonuçlara git.</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700"
                aria-label="Kapat"
              >
                <X size={22} />
              </button>
            </div>

            <div className="grid gap-3">
              <FilterFields {...props} />
            </div>

            <div className="mt-4 grid grid-cols-[1fr_1fr_1fr] gap-2">
              <button
                type="button"
                onClick={runSearch}
                className="rounded-2xl bg-slate-950 px-4 py-4 text-sm font-black text-white shadow-lg shadow-slate-900/20"
              >
                Ara
              </button>
              <button
                type="button"
                className="grid place-items-center rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-blue-700"
                title="Aramayı kaydet"
              >
                <BookmarkPlus size={19} />
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-800"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
