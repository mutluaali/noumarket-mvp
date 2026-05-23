'use client';

import { useMemo } from 'react';
import { BookmarkPlus, Car, Home, Ship, Smartphone, Sofa, BriefcaseBusiness, Wrench, PawPrint, Boxes, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { categoryTree } from '@/lib/categories';

const iconMap = {
  Araç: Car,
  Emlak: Home,
  Denizcilik: Ship,
  Elektronik: Smartphone,
  'Ev & Yaşam': Sofa,
  'İş / Hizmet': BriefcaseBusiness,
  'Yedek Parça': Wrench,
  Hayvanlar: PawPrint,
  Diğer: Boxes,
};

function countBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function labelForCategory(category) {
  if (category === 'Araç') return 'Markalar';
  if (category === 'Elektronik') return 'Markalar';
  if (category === 'Denizcilik') return 'Markalar';
  if (category === 'Emlak') return 'Emlak tipi';
  return 'Alt filtreler';
}

function metadataValue(item, key) {
  const value = item?.metadata?.[key];
  return typeof value === 'string' ? value.trim() : value;
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
  locations = ['Tümü'],
  onSearch,
  onClear,
  onSaveSearch,
  mobileOpen = false,
  onCloseMobile,
}) {
  const selectedCategory = categoryTree.find((item) => item.name === category) || null;
  const categoryCounts = useMemo(() => countBy(listings, (item) => item.category || 'Diğer'), [listings]);

  const scopedListings = useMemo(() => {
    if (!category || category === 'Tümü') return listings;
    return listings.filter((item) => item.category === category);
  }, [listings, category]);

  const subcategoryCounts = useMemo(() => countBy(scopedListings, (item) => item.subcategory || 'Diğer'), [scopedListings]);

  const brandCounts = useMemo(() => {
    const key = category === 'Emlak' ? 'property_type' : 'brand';
    return countBy(scopedListings, (item) => metadataValue(item, key));
  }, [scopedListings, category]);

  const brandEntries = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'))
    .slice(0, 14);

  const activePanelClass = mobileOpen
    ? 'fixed inset-0 z-50 overflow-auto bg-slate-950/50 px-4 py-8 backdrop-blur md:static md:block md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0'
    : 'hidden md:block';

  return (
    <section id="discovery" className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Kategoriler ve filtreler</h2>
          <p className="mt-1 text-sm text-slate-500">Tek merkezden kategori seç, alt filtreleri daralt, sonuçları anında gör.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-800 ring-1 ring-slate-200">{filteredCount} ilan</div>
          <button type="button" onClick={onClear} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">Temizle</button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => { setCategory('Tümü'); setSubcategory('Tümü'); }}
            className={`flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left transition ${category === 'Tümü' ? 'bg-slate-950 text-white' : 'hover:bg-slate-50'}`}
          >
            <span className="font-black">Tüm kategoriler</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${category === 'Tümü' ? 'bg-white/15' : 'bg-slate-100 text-slate-600'}`}>{listings.length}</span>
          </button>
          {categoryTree.map((item) => {
            const Icon = iconMap[item.name] || Boxes;
            const active = category === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => { setCategory(item.name); setSubcategory('Tümü'); }}
                className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${active ? 'bg-slate-950 text-white' : 'bg-white text-slate-800 hover:bg-slate-50'}`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-white/15' : 'bg-slate-100'}`}><Icon size={19} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">{item.name}</span>
                  <span className={`block text-xs font-semibold ${active ? 'text-white/70' : 'text-slate-500'}`}>{categoryCounts[item.name] || 0} ilan</span>
                </span>
                <ChevronRight size={16} className={active ? 'text-white/70' : 'text-slate-400'} />
              </button>
            );
          })}
        </aside>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-black text-slate-950">{category === 'Tümü' ? 'Popüler alt kategoriler' : category}</div>
                  <div className="text-sm text-slate-500">Alt kategori seçimi listeyle entegre çalışır.</div>
                </div>
                {subcategory !== 'Tümü' && (
                  <button type="button" onClick={() => setSubcategory('Tümü')} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200">Alt kategoriyi temizle</button>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {(category === 'Tümü'
                  ? categoryTree.flatMap((item) => item.subcategories.slice(0, 2).map((sub) => ({ parent: item.name, name: sub, count: subcategoryCounts[sub] || 0 })))
                  : (selectedCategory?.subcategories || []).map((sub) => ({ parent: selectedCategory.name, name: sub, count: subcategoryCounts[sub] || 0 })))
                  .map((item) => {
                    const active = subcategory === item.name;
                    return (
                      <button
                        key={`${item.parent}-${item.name}`}
                        type="button"
                        onClick={() => { setCategory(item.parent); setSubcategory(item.name); }}
                        className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold ring-1 transition ${active ? 'bg-blue-600 text-white ring-blue-600' : 'bg-slate-50 text-slate-700 ring-slate-200 hover:bg-white hover:shadow-sm'}`}
                      >
                        <span className="min-w-0 truncate">{item.name}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/15 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>{item.count}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="rounded-[1.35rem] bg-slate-50 p-3 ring-1 ring-slate-200">
              <div className="mb-2 text-sm font-black text-slate-950">{labelForCategory(category)}</div>
              {brandEntries.length ? (
                <div className="grid gap-2">
                  {brandEntries.map(([name, count]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSubcategory(name)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold transition ${subcategory === name ? 'bg-slate-950 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'}`}
                    >
                      <span className="truncate">{name}</span>
                      <span className={subcategory === name ? 'text-white/70' : 'text-slate-400'}>{count}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-white p-3 text-sm font-semibold leading-6 text-slate-500 ring-1 ring-slate-200">Bu kategoride marka/tip bilgisi olan ilan henüz yok. Yeni ilanlarda marka alanı doldukça burada otomatik görünecek.</div>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800"><SlidersHorizontal size={17} /> Filtreleme</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto]">
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none">
                {locations.map((x) => <option key={x}>{x}</option>)}
              </select>
              <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" placeholder="Min XPF" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none" />
              <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="Max XPF" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none" />
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none">
                <option value="newest">En yeni</option>
                <option value="popular">En popüler</option>
                <option value="price_low">Fiyat düşükten yükseğe</option>
                <option value="price_high">Fiyat yüksekten düşüğe</option>
              </select>
              <div className="grid grid-cols-3 gap-2 xl:w-[245px]">
                <button type="button" onClick={() => { onSearch?.(); onCloseMobile?.(); }} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Uygula</button>
                <button type="button" onClick={onSaveSearch} className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 text-sky-700" title="Aramayı kaydet"><BookmarkPlus size={16} /></button>
                <button type="button" onClick={() => { onClear?.(); onCloseMobile?.(); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm">Sil</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={activePanelClass}>
        <div className="md:hidden">
          <div className="mb-3 flex items-center justify-between rounded-3xl bg-white p-3 shadow-xl">
            <div className="font-black text-slate-950">Filtreler</div>
            <button type="button" onClick={onCloseMobile} className="rounded-full bg-slate-100 p-2"><X size={18} /></button>
          </div>
          <div className="rounded-[1.75rem] bg-white p-4 shadow-xl ring-1 ring-slate-200">
            <div className="grid gap-3">
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none">
                {locations.map((x) => <option key={x}>{x}</option>)}
              </select>
              <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" placeholder="Min XPF" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none" />
              <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="Max XPF" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none" />
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none">
                <option value="newest">En yeni</option>
                <option value="popular">En popüler</option>
                <option value="price_low">Fiyat düşükten yükseğe</option>
                <option value="price_high">Fiyat yüksekten düşüğe</option>
              </select>
              <button type="button" onClick={() => { onSearch?.(); onCloseMobile?.(); }} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Uygula</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
