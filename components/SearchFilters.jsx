'use client';

import { useEffect, useState } from 'react';
import { Filter, Search, X, SlidersHorizontal, MapPin, ArrowUpDown, Loader2 } from 'lucide-react';
import { FIELD_DEFINITIONS, VEHICLE_MODELS } from '@/lib/categorySchema';
import { LOCATION_OPTIONS } from '@/lib/locations';
import { SORT_LABELS } from '@/components/ActiveFilterChips';

const FORCE_RANGE_FIELDS = new Set([
  'year', 'mileage', 'engineHours', 'rangeKm', 'areaM2', 'deposit', 'floor', 'price',
]);

function parsePrice(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? Number(digits) : null;
}

function validatePriceRange(minPrice, maxPrice) {
  const min = parsePrice(minPrice);
  const max = parsePrice(maxPrice);
  if (min !== null && max !== null && min > max) {
    return 'Geçerli bir fiyat aralığı girin';
  }
  return '';
}

function formatPriceInput(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('tr-TR');
}

function FieldShell({ children, className = '' }) {
  return <div className={`nm-field flex min-h-[52px] min-w-0 items-center gap-2 rounded-2xl border px-3 shadow-sm transition focus-within:ring-4 ${className}`}>{children}</div>;
}

function SelectShell({ children, icon }) {
  return <div className="relative min-w-0"><div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400">{icon}</div>{children}</div>;
}

function CityPicker({ location, setLocation }) {
  return (
    <SelectShell icon={<MapPin size={17} />}>
      <select
        value={location || 'Tumu'}
        onChange={(event) => setLocation(event.target.value)}
        className="nm-field min-h-[52px] w-full min-w-0 appearance-none rounded-2xl border py-3 pl-10 pr-9 text-sm font-black shadow-sm outline-none transition focus:ring-4"
        aria-label="Konum seç"
      >
        {LOCATION_OPTIONS.map((item) => (
          <option key={item} value={item}>{item === 'Tumu' ? 'Tüm konumlar' : item}</option>
        ))}
      </select>
    </SelectShell>
  );
}

function FilterFields({
  query,
  setQuery,
  location,
  setLocation,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sort,
  setSort,
  onSubmit,
  isLoading = false,
  priceError = '',
  hideQueryField = false,
}) {
  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit?.();
    }
  }

  return (
    <div className={`grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2 ${hideQueryField ? 'xl:grid-cols-[minmax(190px,.8fr)_minmax(130px,.55fr)_minmax(130px,.55fr)_minmax(150px,.65fr)]' : 'xl:grid-cols-[minmax(260px,1.2fr)_minmax(190px,.8fr)_minmax(130px,.55fr)_minmax(130px,.55fr)_minmax(150px,.65fr)]'}`}>
      {hideQueryField ? null : (
        <FieldShell>
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="İlan, kategori veya anahtar kelime ara"
            aria-label="İlan ara"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--foreground)] outline-none placeholder:text-[var(--placeholder)]"
          />
        </FieldShell>
      )}
      <CityPicker location={location} setLocation={setLocation} />
      <div className="min-w-0">
        <input
          value={minPrice}
          onChange={(event) => setMinPrice(formatPriceInput(event.target.value))}
          onKeyDown={handleKeyDown}
          inputMode="numeric"
          placeholder="En düşük fiyat"
          aria-label="En düşük fiyat"
          className="nm-field min-h-[52px] w-full min-w-0 rounded-2xl border px-3 text-sm font-bold shadow-sm outline-none placeholder:text-[var(--placeholder)] transition focus:ring-4"
        />
      </div>
      <div className="min-w-0">
        <input
          value={maxPrice}
          onChange={(event) => setMaxPrice(formatPriceInput(event.target.value))}
          onKeyDown={handleKeyDown}
          inputMode="numeric"
          placeholder="En yüksek fiyat"
          aria-label="En yüksek fiyat"
          className="nm-field min-h-[52px] w-full min-w-0 rounded-2xl border px-3 text-sm font-bold shadow-sm outline-none placeholder:text-[var(--placeholder)] transition focus:ring-4"
        />
      </div>
      <SelectShell icon={<ArrowUpDown size={17} />}>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="nm-field min-h-[52px] w-full min-w-0 appearance-none rounded-2xl border py-3 pl-10 pr-9 text-sm font-black shadow-sm outline-none transition focus:ring-4"
          aria-label="Sıralama"
        >
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </SelectShell>
      {priceError ? (
        <p className={`text-xs font-bold text-rose-600 lg:col-span-2 ${hideQueryField ? 'xl:col-span-4' : 'xl:col-span-5'}`}>{priceError}</p>
      ) : (
        <p className={`text-[11px] font-semibold text-slate-400 lg:col-span-2 ${hideQueryField ? 'xl:col-span-4' : 'xl:col-span-5'}`}>Fiyat aralığı XPF cinsindendir.</p>
      )}
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
    <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-3 dark:border-cyan-300/20 dark:bg-cyan-400/10 sm:rounded-3xl">
      <div className="mb-3">
        <div className="text-[11px] font-black uppercase tracking-wide text-blue-600 dark:text-cyan-300">Alt kategoriler · özel filtreler</div>
        <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">Seçili kategoriye göre ek kriterler.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {fields.map((fieldKey) => {
          const config = FIELD_DEFINITIONS[fieldKey];
          if (!config) return null;
          if (shouldRenderRange(fieldKey, config)) {
            return (
              <div key={fieldKey} className="min-w-0">
                <div className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{config.label}</div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={advancedFilters[`${fieldKey}Min`] || ''} onChange={(e) => update(`${fieldKey}Min`, e.target.value)} inputMode="numeric" placeholder="Min" className="nm-field min-h-[48px] min-w-0 rounded-2xl border px-3 text-sm font-bold outline-none placeholder:text-[var(--placeholder)] focus:ring-4" />
                  <input value={advancedFilters[`${fieldKey}Max`] || ''} onChange={(e) => update(`${fieldKey}Max`, e.target.value)} inputMode="numeric" placeholder="Max" className="nm-field min-h-[48px] min-w-0 rounded-2xl border px-3 text-sm font-bold outline-none placeholder:text-[var(--placeholder)] focus:ring-4" />
                </div>
              </div>
            );
          }
          if (config.type === 'select') {
            return (
              <label key={fieldKey} className="min-w-0">
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{config.label}</span>
                <select value={advancedFilters[fieldKey] || ''} onChange={(e) => update(fieldKey, e.target.value)} className="nm-field min-h-[48px] w-full min-w-0 rounded-2xl border px-3 text-sm font-black outline-none focus:ring-4">
                  <option value="">Tümü</option>
                  {(config.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            );
          }
          if (fieldKey === 'model' && modelOptions.length) {
            return (
              <label key={fieldKey} className="min-w-0">
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{config.label}</span>
                <select value={advancedFilters[fieldKey] || ''} onChange={(e) => update(fieldKey, e.target.value)} className="nm-field min-h-[48px] w-full min-w-0 rounded-2xl border px-3 text-sm font-black outline-none focus:ring-4">
                  <option value="">Tümü</option>
                  {modelOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            );
          }
          return (
            <label key={fieldKey} className="min-w-0">
              <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{config.label}</span>
              <input value={advancedFilters[fieldKey] || ''} onChange={(e) => update(fieldKey, e.target.value)} placeholder={config.placeholder || config.label} className="nm-field min-h-[48px] w-full min-w-0 rounded-2xl border px-3 text-sm font-bold outline-none placeholder:text-[var(--placeholder)] focus:ring-4" />
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function SearchFilters(props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [priceError, setPriceError] = useState('');
  const selectedLabel = props.selectedCategory?.path?.map((item) => item.label).join(' › ');

  function runSearch() {
    const nextPriceError = validatePriceRange(props.minPrice, props.maxPrice);
    setPriceError(nextPriceError);
    if (nextPriceError) return;
    props.onSearch?.();
    setMobileOpen(false);
  }

  function clearFilters() {
    setPriceError('');
    props.onClear?.();
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(event) {
      if (event.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const fieldProps = {
    ...props,
    onSubmit: runSearch,
    isLoading: props.isLoading,
    priceError,
    hideQueryField: props.hideQueryField,
  };

  const content = (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white"><SlidersHorizontal size={17} /> Filtreler</div>
          <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
            {selectedLabel ? `Seçili kategori: ${selectedLabel}` : 'Konum, fiyat ve sıralamaya göre sonuçları daralt.'}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:shrink-0">
          <button type="button" onClick={clearFilters} className="nm-field min-h-[48px] rounded-2xl border px-4 py-3 text-sm font-black hover:bg-[var(--field-hover)] sm:px-5">Filtreleri temizle</button>
          <button type="button" onClick={runSearch} disabled={props.isLoading} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 disabled:opacity-60 dark:bg-cyan-600 dark:hover:bg-cyan-500 sm:px-7">
            {props.isLoading ? <><Loader2 size={16} className="animate-spin" /> Aranıyor...</> : 'Ara'}
          </button>
        </div>
      </div>
      <FilterFields {...fieldProps} />
      <CategorySpecificFilters selectedCategory={props.selectedCategory} advancedFilters={props.advancedFilters} setAdvancedFilters={props.setAdvancedFilters} />
    </>
  );

  return (
    <section className="mt-4 scroll-mt-24">
      <div className="nm-panel hidden rounded-3xl border p-4 shadow-sm backdrop-blur md:block">{content}</div>
      <div className="md:hidden">
        <button type="button" onClick={() => setMobileOpen(true)} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/25">
          <Filter size={18} /> Filtreler
        </button>
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-[100] md:hidden">
          <button type="button" aria-label="Filtreyi kapat" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
          <div onClick={(event) => event.stopPropagation()} className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[28px] bg-[var(--surface)] p-4 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">Filtreler</h3>
                <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">Arama, konum, fiyat ve sıralamayı ayarla.</p>
              </div>
              <button type="button" onClick={() => setMobileOpen(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200" aria-label="Kapat"><X size={22} /></button>
            </div>
            <FilterFields {...fieldProps} />
            <CategorySpecificFilters selectedCategory={props.selectedCategory} advancedFilters={props.advancedFilters} setAdvancedFilters={props.setAdvancedFilters} />
            <div className="sticky bottom-0 mt-4 grid grid-cols-2 gap-2 border-t border-[var(--field-border)] bg-[var(--surface)] pt-3 pb-[env(safe-area-inset-bottom)]">
              <button type="button" onClick={clearFilters} className="nm-field min-h-[48px] rounded-2xl border px-4 py-4 text-sm font-black">Filtreleri temizle</button>
              <button type="button" onClick={runSearch} disabled={props.isLoading} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-4 text-sm font-black text-white shadow-lg shadow-slate-900/20 dark:bg-cyan-600">
                {props.isLoading ? <><Loader2 size={16} className="animate-spin" /> Aranıyor...</> : 'Sonuçları göster'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
