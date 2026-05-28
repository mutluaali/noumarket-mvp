'use client';

import { useState } from 'react';
import { Filter, Search, X, BookmarkPlus, SlidersHorizontal, MapPin, ArrowUpDown } from 'lucide-react';
import { FIELD_DEFINITIONS, VEHICLE_MODELS } from '@/lib/categorySchema';
import { LOCATION_OPTIONS } from '@/lib/locations';

const FORCE_RANGE_FIELDS = new Set([
  'year', 'mileage', 'engineHours', 'rangeKm', 'areaM2', 'deposit', 'floor', 'price',
]);

function FieldShell({ children, className = '' }) {
  return <div className={`flex min-h-[52px] min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-cyan-300 focus-within:ring-4 focus-within:ring-cyan-50 dark:border-white/10 dark:bg-white/5 dark:focus-within:ring-cyan-400/20 ${className}`}>{children}</div>;
}

function SelectShell({ children, icon }) {
  return <div className="relative min-w-0"><div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400">{icon}</div>{children}</div>;
}

function CityPicker({ location, setLocation }) {
  return (
    <SelectShell icon={<MapPin size={17} />}>
      <select
        value={location || 'Tümü'}
        onChange={(event) => setLocation(event.target.value)}
        className="min-h-[52px] w-full min-w-0 appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm font-black text-slate-800 shadow-sm outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:ring-cyan-400/20"
      >
        {LOCATION_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </SelectShell>
  );
}

function FilterFields({ query, setQuery, location, setLocation, minPrice, setMinPrice, maxPrice, setMaxPrice, sort, setSort }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(260px,1.2fr)_minmax(190px,.8fr)_minmax(130px,.55fr)_minmax(130px,.55fr)_minmax(150px,.65fr)]">
      <FieldShell>
        <Search size={18} className="shrink-0 text-slate-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="İlan, marka, model veya anahtar kelime ara" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" />
      </FieldShell>
      <CityPicker location={location} setLocation={setLocation} />
      <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} inputMode="numeric" placeholder="Min XPF" className="min-h-[52px] w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm outline-none placeholder:text-slate-400 transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-cyan-400/20" />
      <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} inputMode="numeric" placeholder="Max XPF" className="min-h-[52px] w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm outline-none placeholder:text-slate-400 transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-cyan-400/20" />
      <SelectShell icon={<ArrowUpDown size={17} />}>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-[52px] w-full min-w-0 appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm font-black text-slate-800 shadow-sm outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:ring-cyan-400/20">
          <option value="newest">En yeni</option>
          <option value="price_asc">Fiyat artan</option>
          <option value="price_desc">Fiyat azalan</option>
          <option value="popular">Popüler</option>
        </select>
      </SelectShell>
    </div>
  );
}

function shouldRenderRange(fieldKey, config) {
  return FORCE_RANGE_FIELDS.has(fieldKey) || config?.type === 'number';
}

function CategorySpecificFilters({ selectedCategory, advancedFilters = {}, setAdvancedFilters }) {
  const fields = selectedCategory?.node?.fields || [];
  const modelOptions = VEHICLE_MODELS[selectedCategory?.node?.id] || [];
  if (!fields.length) return null;

  function update(key, value) {
    setAdvancedFilters?.((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-3 sm:rounded-3xl">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-black uppercase tracking-wide text-blue-600">Seçili kategoriye özel filtreler</div>
          <p className="mt-1 text-xs font-semibold text-slate-400">Sayısal alanlar min/max aralığıyla filtrelenir.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {fields.map((fieldKey) => {
          const config = FIELD_DEFINITIONS[fieldKey];
          if (!config) return null;
          if (shouldRenderRange(fieldKey, config)) {
            return (
              <div key={fieldKey} className="min-w-0">
                <div className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500">{config.label}</div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={advancedFilters[`${fieldKey}Min`] || ''} onChange={(e) => update(`${fieldKey}Min`, e.target.value)} inputMode="numeric" placeholder="Min" className="min-h-[48px] min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
                  <input value={advancedFilters[`${fieldKey}Max`] || ''} onChange={(e) => update(`${fieldKey}Max`, e.target.value)} inputMode="numeric" placeholder="Max" className="min-h-[48px] min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
                </div>
              </div>
            );
          }
          if (config.type === 'select') {
            return (
              <label key={fieldKey} className="min-w-0">
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{config.label}</span>
                <select value={advancedFilters[fieldKey] || ''} onChange={(e) => update(fieldKey, e.target.value)} className="min-h-[48px] w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50">
                  <option value="">Tümü</option>
                  {(config.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            );
          }
          if (fieldKey === 'model' && modelOptions.length) {
            return (
              <label key={fieldKey} className="min-w-0">
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{config.label}</span>
                <select value={advancedFilters[fieldKey] || ''} onChange={(e) => update(fieldKey, e.target.value)} className="min-h-[48px] w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50">
                  <option value="">Tümü</option>
                  {modelOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            );
          }
          return (
            <label key={fieldKey} className="min-w-0">
              <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{config.label}</span>
              <input value={advancedFilters[fieldKey] || ''} onChange={(e) => update(fieldKey, e.target.value)} placeholder={config.placeholder || config.label} className="min-h-[48px] w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function SearchFilters(props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const selectedLabel = props.selectedCategory?.path?.map((item) => item.label).join(' › ');

  function runSearch() { props.onSearch?.(); setMobileOpen(false); }
  function clearFilters() { props.onClear?.(); setMobileOpen(false); }

  const content = (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-black text-slate-800"><SlidersHorizontal size={17} /> Filtrele</div>
          <p className="mt-1 text-xs font-semibold text-slate-400">{selectedLabel ? `${selectedLabel} için filtreler aktif.` : 'Kategori soldan seçilir; burada sonuçları daralt.'}</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:shrink-0">
          <button type="button" onClick={clearFilters} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 sm:px-5">Temizle</button>
          <button type="button" onClick={runSearch} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 sm:px-7">Ara</button>
        </div>
      </div>
      <FilterFields {...props} />
      <CategorySpecificFilters selectedCategory={props.selectedCategory} advancedFilters={props.advancedFilters} setAdvancedFilters={props.setAdvancedFilters} />
    </>
  );

  return (
    <section className="mt-4 scroll-mt-24">
      <div className="hidden rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/85 md:block">{content}</div>
      <div className="md:hidden"><button type="button" onClick={() => setMobileOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25"><Filter size={18} /> Filtrele ve ara</button></div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-[100] md:hidden">
          <button type="button" aria-label="Filtreyi kapat" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
          <div className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div><h3 className="text-lg font-black text-slate-950">Filtrele</h3><p className="mt-1 text-xs font-semibold text-slate-400">Konum, fiyat ve kategoriye özel aralıkları seç.</p></div>
              <button type="button" onClick={() => setMobileOpen(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700" aria-label="Kapat"><X size={22} /></button>
            </div>
            <FilterFields {...props} />
            <CategorySpecificFilters selectedCategory={props.selectedCategory} advancedFilters={props.advancedFilters} setAdvancedFilters={props.setAdvancedFilters} />
            <div className="sticky bottom-0 mt-4 grid grid-cols-[1fr_52px_1fr] gap-2 border-t border-slate-100 bg-white pt-3">
              <button type="button" onClick={runSearch} className="rounded-2xl bg-slate-950 px-4 py-4 text-sm font-black text-white shadow-lg shadow-slate-900/20">Ara</button>
              <button type="button" className="grid place-items-center rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-blue-700" title="Aramayı kaydet"><BookmarkPlus size={19} /></button>
              <button type="button" onClick={clearFilters} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-800">Sil</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
