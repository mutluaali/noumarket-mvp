'use client';

import { Bike, Building2, Car, ChevronRight, CircleDot, Cpu, Fish, Home, MapPin, PawPrint, RotateCcw, SearchCheck, ShipWheel, SlidersHorizontal, Sparkles, Wrench } from 'lucide-react';
import { categoryTree, getCategoryFacets } from '@/lib/categories';

const categoryIcons = {
  Araç: Car,
  Emlak: Building2,
  Denizcilik: ShipWheel,
  Elektronik: Cpu,
  'Ev & Yaşam': Home,
  'İş / Hizmet': Wrench,
  'Yedek Parça': Wrench,
  Hayvanlar: PawPrint,
  Diğer: Bike,
};

export function selectionMatches(item, selection) {
  if (!selection || selection === 'Tümü') return true;
  const normalized = String(selection).toLowerCase();
  const metadata = item?.metadata && typeof item.metadata === 'object' ? item.metadata : {};
  const haystack = [
    item?.title,
    item?.description,
    item?.category,
    item?.subcategory,
    item?.location,
    item?.seller,
    item?.brand,
    item?.model,
    item?.condition,
    ...Object.values(metadata).flatMap((value) => Array.isArray(value) ? value : [value]),
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(normalized);
}

function countByCategory(listings, categoryName) {
  if (categoryName === 'Tümü') return listings.length;
  return listings.filter((item) => item.category === categoryName).length;
}

function countBySelection(listings, selection) {
  return listings.filter((item) => selectionMatches(item, selection)).length;
}

function countByLocation(listings, location) {
  if (location === 'Tümü') return listings.length;
  return listings.filter((item) => item.location === location).length;
}

function TreeButton({ active, disabled, children, count, onClick, title, className = '' }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`group flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition ${active ? 'bg-cyan-50 font-black text-cyan-800 ring-1 ring-cyan-200' : disabled ? 'cursor-not-allowed text-slate-300' : 'font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-950'} ${className}`}
    >
      <span className="min-w-0 truncate">{children}</span>
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black ${active ? 'bg-white text-cyan-700' : 'bg-slate-100 text-slate-400 group-hover:text-slate-700'}`}>{count}</span>
    </button>
  );
}

function Section({ title, children, eyebrow }) {
  return (
    <section className="border-b border-slate-200 p-3 last:border-b-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[12px] font-black uppercase tracking-[0.14em] text-slate-500">{title}</h3>
        {eyebrow ? <span className="text-[10px] font-black text-cyan-600">{eyebrow}</span> : null}
      </div>
      {children}
    </section>
  );
}

export default function MarketplaceDiscovery({
  listings = [],
  filteredCount = 0,
  category,
  setCategory,
  subcategory,
  setSubcategory,
  location,
  setLocation,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sort,
  setSort,
  locations = [],
  onSearch,
  onClear,
  onSaveSearch,
}) {
  const activeCategory = category || 'Tümü';
  const activeCategoryListings = activeCategory === 'Tümü' ? listings : listings.filter((item) => item.category === activeCategory);
  const popularLocations = locations.filter((item) => item !== 'Tümü').slice(0, 9);

  function chooseCategory(name) {
    setCategory(name);
    setSubcategory('Tümü');
  }

  function chooseSelection(name, categoryName) {
    if (categoryName && activeCategory !== categoryName) setCategory(categoryName);
    setSubcategory(name);
  }

  return (
    <aside id="market-filters" className="sticky top-[76px] max-h-[calc(100vh-88px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 to-slate-800 p-3 text-white">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200"><SlidersHorizontal size={14} /> Kategori ve filtre</div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <div className="text-2xl font-black tracking-tight">{filteredCount}</div>
            <div className="text-xs font-bold text-white/55">eşleşen ilan</div>
          </div>
          <button type="button" onClick={onClear} className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-black text-white ring-1 ring-white/15 hover:bg-white/15"><RotateCcw size={12}/> Sıfırla</button>
        </div>
      </div>

      <div className="max-h-[calc(100vh-210px)] overflow-y-auto">
        <Section title="Ana kategoriler" eyebrow="canlı">
          <div className="space-y-2">
            <TreeButton active={activeCategory === 'Tümü'} count={listings.length} onClick={() => chooseCategory('Tümü')}>Tüm ilanlar</TreeButton>
            {categoryTree.map((cat) => {
              const Icon = categoryIcons[cat.name] || CircleDot;
              const catCount = countByCategory(listings, cat.name);
              const catListings = listings.filter((item) => item.category === cat.name);
              const featuredFacet = getCategoryFacets(cat.name).find((facet) => facet.featured) || getCategoryFacets(cat.name)[0];
              const isCategoryActive = activeCategory === cat.name;
              const mainOptions = featuredFacet?.options || [];

              return (
                <div key={cat.name} className={`rounded-lg border ${isCategoryActive ? 'border-cyan-200 bg-cyan-50/40' : 'border-slate-200 bg-white'}`}>
                  <button type="button" onClick={() => chooseCategory(cat.name)} className={`flex w-full items-center gap-2 rounded-t-lg px-2.5 py-2 text-left transition ${isCategoryActive ? 'text-slate-950' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'}`}>
                    <Icon size={16} className={isCategoryActive ? 'text-cyan-700' : 'text-slate-400'} />
                    <span className="min-w-0 flex-1 truncate text-sm font-black">{cat.label || cat.name}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500">{catCount}</span>
                  </button>

                  <div className="border-t border-slate-100 p-2">
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-slate-400"><ChevronRight size={11}/> Alt kategoriler</div>
                    <div className="grid gap-1">
                      {cat.subcategories.slice(0, 9).map((sub) => {
                        const c = countBySelection(catListings, sub);
                        return <TreeButton key={sub} active={activeCategory === cat.name && subcategory === sub} count={c} disabled={catCount > 0 && c === 0} onClick={() => chooseSelection(sub, cat.name)}>{sub}</TreeButton>;
                      })}
                    </div>

                    {mainOptions.length ? (
                      <div className="mt-2 border-t border-slate-100 pt-2">
                        <div className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-slate-400"><Sparkles size={11}/> {featuredFacet.label}</div>
                        <div className="grid grid-cols-2 gap-1">
                          {mainOptions.map((option) => {
                            const c = countBySelection(catListings, option);
                            return <TreeButton key={`${cat.name}-${option}`} active={activeCategory === cat.name && subcategory === option} count={c} disabled={catCount > 0 && c === 0} onClick={() => chooseSelection(option, cat.name)} title={`${cat.label} / ${option}`}>{option}</TreeButton>;
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Detaylı filtreler">
          <div className="space-y-3">
            {activeCategory !== 'Tümü' && getCategoryFacets(activeCategory).filter((facet) => !facet.featured).slice(0, 4).map((facet) => (
              <div key={facet.key}>
                <div className="mb-1 text-[12px] font-black text-slate-500">{facet.label}</div>
                <div className="grid grid-cols-2 gap-1">
                  {facet.options.slice(0, 12).map((option) => {
                    const c = countBySelection(activeCategoryListings, option);
                    return <TreeButton key={`${facet.key}-${option}`} active={subcategory === option} count={c} disabled={activeCategoryListings.length > 0 && c === 0} onClick={() => setSubcategory(option)}>{option}</TreeButton>;
                  })}
                </div>
              </div>
            ))}
            {activeCategory === 'Tümü' ? <div className="rounded-lg bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500">Önce bir ana kategori seç; marka, model, oda, cihaz tipi gibi özel filtreler burada açılır.</div> : null}
          </div>
        </Section>

        <Section title="Fiyat">
          <div className="grid grid-cols-2 gap-2">
            <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} inputMode="numeric" placeholder="Min" className="h-9 rounded-lg border border-slate-200 px-2 text-sm font-bold outline-none focus:border-cyan-600" />
            <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} inputMode="numeric" placeholder="Max" className="h-9 rounded-lg border border-slate-200 px-2 text-sm font-bold outline-none focus:border-cyan-600" />
          </div>
        </Section>

        <Section title="Konum">
          <div className="grid gap-1">
            <TreeButton active={location === 'Tümü'} count={listings.length} onClick={() => setLocation('Tümü')}>Tüm konumlar</TreeButton>
            {popularLocations.map((place) => <TreeButton key={place} active={location === place} count={countByLocation(listings, place)} onClick={() => setLocation(place)}><span className="inline-flex min-w-0 items-center gap-1 truncate"><MapPin size={12}/> {place}</span></TreeButton>)}
          </div>
        </Section>

        <Section title="Sıralama">
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm font-black text-slate-800 outline-none focus:border-cyan-600">
            <option value="newest">En yeni ilanlar</option>
            <option value="popular">En çok görüntülenen</option>
            <option value="price_asc">Fiyat: düşükten yükseğe</option>
            <option value="price_desc">Fiyat: yüksekten düşüğe</option>
          </select>
        </Section>
      </div>

      <div className="grid gap-2 border-t border-slate-200 bg-white p-3">
        <button type="button" onClick={onSearch} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-700 text-sm font-black text-white transition hover:bg-cyan-800"><SearchCheck size={16}/> Sonuçları göster</button>
        <button type="button" onClick={onSaveSearch} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-700 transition hover:bg-slate-50"><SlidersHorizontal size={14}/> Bu aramayı kaydet</button>
      </div>
    </aside>
  );
}
