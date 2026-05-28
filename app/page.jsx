'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ShieldCheck, Crown, Home, Grid2X2, MessageCircle, UserRound, Plus, MapPin, CreditCard, BadgeCheck, Headphones, Users, Tag } from 'lucide-react';
import Header from '@/components/Header';
import AuthModal from '@/components/AuthModal';
import ListingCard from '@/components/ListingCard';
import ListingDetailModal from '@/components/ListingDetailModal';
import ListingForm from '@/components/ListingForm';
import AdminPanel from '@/components/AdminPanel';
import PricingModal from '@/components/PricingModal';
import MyListingsModal from '@/components/MyListingsModal';
import ChatModal from '@/components/ChatModal';
import MessagesModal from '@/components/MessagesModal';
import FavoritesModal from '@/components/FavoritesModal';
import NotificationsModal from '@/components/NotificationsModal';
import SearchFilters from '@/components/SearchFilters';
import { getOrCreateConversation } from '@/lib/messages';
import { searchListings } from '@/lib/search';
import { demoListings, formatXpf } from '@/lib/demoData';
import { supabase } from '@/lib/supabase';
import { withTimeout, withTimeoutFallback } from '@/lib/safeAsync';
import { getUnreadNotificationCount } from '@/lib/notifications';
import { getCurrentProfile, userIsAdmin } from '@/lib/profiles';
import { getAdminListings, createListing, approveListing, rejectListing, deleteListing, toggleFeaturedListing, normalizeListing } from '@/lib/listings';
import { CATEGORY_TREE, buildCategoryLabel, findCategoryNode, getDescendantCategoryIds, calculateCategoryCounts } from '@/lib/categorySchema';
import { LOCATION_OPTIONS } from '@/lib/locations';
import MarketplaceSidebar from '@/components/MarketplaceSidebar';

function BottomNav({ onCreate, onMessages, onMyListings, onNotifications }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-950/95 md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
        <button className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2"><Home size={18} /> Ana</button>
        <button onClick={() => window.scrollTo({ top: 520, behavior: 'smooth' })} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2"><Grid2X2 size={18} /> Kategori</button>
        <button onClick={onCreate} className="-mt-5 flex flex-col items-center gap-1 rounded-2xl bg-cyan-600 px-2 py-3 text-white shadow-lg shadow-cyan-600/25"><Plus size={22} /> İlan ver</button>
        <button onClick={onMessages} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2"><MessageCircle size={18} /> Mesaj</button>
        <button onClick={onMyListings || onNotifications} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2"><UserRound size={18} /> Profil</button>
      </div>
    </nav>
  );
}

export default function HomePage(){
 const [listings,setListings]=useState(demoListings);
 const [loadingListings,setLoadingListings]=useState(true);
 const [user,setUser]=useState(null);
 const [profile,setProfile]=useState(null);
 const [isAdmin,setIsAdmin]=useState(false);
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('Tümü');
 const [selectedCategoryId,setSelectedCategoryId]=useState(null);
 const [location,setLocation]=useState('Tümü');
 const [minPrice,setMinPrice]=useState('');
 const [maxPrice,setMaxPrice]=useState('');
 const [sort,setSort]=useState('newest');
 const [advancedFilters,setAdvancedFilters]=useState({});
 const [selected,setSelected]=useState(null);
 const [showAuth,setShowAuth]=useState(false);
 const [showCreate,setShowCreate]=useState(false);
 const [showAdmin,setShowAdmin]=useState(false);
 const [showPricing,setShowPricing]=useState(false);
 const [showMyListings,setShowMyListings]=useState(false);
 const [showMessages,setShowMessages]=useState(false);
 const [showFavorites,setShowFavorites]=useState(false);
 const [showNotifications,setShowNotifications]=useState(false);
 const [notificationCount,setNotificationCount]=useState(0);
 const [activeConversation,setActiveConversation]=useState(null);
 const [theme,setTheme]=useState('light');
 const listingsSectionRef = useRef(null);
 const listingRequestRef = useRef(0);

 useEffect(()=>{
   const stored = typeof window !== 'undefined' ? window.localStorage.getItem('noumarket-theme') : null;
   const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
   setTheme(stored || (prefersDark ? 'dark' : 'light'));
 },[]);

 useEffect(()=>{
   if(typeof document === 'undefined') return;
   document.documentElement.classList.toggle('dark', theme === 'dark');
   window.localStorage?.setItem('noumarket-theme', theme);
 },[theme]);

 function toggleTheme(){
   setTheme((current) => current === 'dark' ? 'light' : 'dark');
 }

 async function refreshProfile(currentUser){
   if(!currentUser?.id){
     setProfile(null);
     setIsAdmin(false);
     setShowAdmin(false);
     return;
   }

   try {
     const nextProfile = await withTimeout(getCurrentProfile(currentUser.id), 8000, 'Profil bilgisi zaman aşımına uğradı');
     setProfile(nextProfile);
     setIsAdmin(userIsAdmin(nextProfile));
   } catch (error) {
     console.warn('refreshProfile:', error);
     setProfile(null);
     setIsAdmin(false);
   }
 }

 async function refreshListings(overrides = {}){
   const requestId = ++listingRequestRef.current;
   const filters = { query, category, location, minPrice, maxPrice, sort, ...overrides };
   const isAllOption = (value) => !value || (/^t/i.test(String(value)) && String(value).toLowerCase().includes('m'));
   const isUnfiltered = !filters.query && isAllOption(filters.category) && isAllOption(filters.location) && !filters.minPrice && !filters.maxPrice;
   setLoadingListings(true);
   try{
     const data = showAdmin && isAdmin
       ? await withTimeoutFallback(getAdminListings(), 9000, null)
       : await withTimeoutFallback(searchListings(filters), 9000, null);
     if (requestId !== listingRequestRef.current) return;
     if (Array.isArray(data) && data.length) setListings(data.map(normalizeListing));
     else if (Array.isArray(data) && data.length === 0) setListings(isUnfiltered ? demoListings : []);
     else setListings((current) => (current.length ? current : demoListings));
   }catch(error){
     console.warn(error);
     if (requestId === listingRequestRef.current) {
       setListings((current) => (current.length ? current : demoListings));
     }
   }finally{
     if (requestId === listingRequestRef.current) setLoadingListings(false);
   }
 }

 async function refreshNotifications(currentUser = user){
   if(!currentUser?.id){
     setNotificationCount(0);
     return;
   }

   try {
     const count = await withTimeoutFallback(getUnreadNotificationCount(currentUser.id), 15000, 0);
     setNotificationCount(Number(count || 0));
   } catch (error) {
     console.warn('refreshNotifications fallback:', error);
     setNotificationCount(0);
   }
 }

 useEffect(()=>{
   let mounted = true;
   withTimeoutFallback(supabase.auth.getUser(), 12000, { data: { user: null } })
     .then(async ({data})=>{
       if(!mounted) return;
       const currentUser = data.user ?? null;
       setUser(currentUser);
       await refreshProfile(currentUser);
       await refreshNotifications(currentUser);
     })
     .catch((error)=>{
       console.warn('auth init:', error);
       if(mounted){
         setUser(null);
         setProfile(null);
         setIsAdmin(false);
         setNotificationCount(0);
       }
     });

   const {data:listener}=supabase.auth.onAuthStateChange(async (_event,session)=>{
     const currentUser = session?.user ?? null;
     setUser(currentUser);
     await refreshProfile(currentUser);
     await refreshNotifications(currentUser);
   });

   return ()=>{ mounted = false; listener.subscription.unsubscribe(); };
 },[]);

 useEffect(()=>{refreshListings()},[showAdmin,isAdmin]);

 useEffect(()=>{
   if(!loadingListings) return undefined;
   const timer = setTimeout(() => setLoadingListings(false), 10000);
   return () => clearTimeout(timer);
 },[loadingListings]);

 const approved=listings.filter(x=>x.status==='approved');
 const pending=listings.filter(x=>x.status==='pending');
 const categoryCounts = useMemo(() => calculateCategoryCounts(approved), [approved]);

 const stats=useMemo(()=>{
   const totalViews=approved.reduce((a,x)=>a+(x.views||0),0);
   const featured=approved.filter(x=>x.isFeatured).length;
   const risky=listings.filter(x=>Number(x.trustScore||0)<55).length;
   return {totalViews,featured,estimatedRevenue:featured*1500,risky};
 },[approved,listings]);

 const selectedCategory = useMemo(() => selectedCategoryId ? findCategoryNode(selectedCategoryId) : null, [selectedCategoryId]);
 const selectedPath = selectedCategory?.path || [];
 const activeSubcategoryOptions = useMemo(() => {
   if(!selectedCategory) return [];
   const node = selectedCategory.node;
   if(node.children?.length) return node.children;
   const parent = selectedPath[selectedPath.length - 2];
   return parent?.children || [];
 }, [selectedCategory, selectedPath]);
 const selectedCategoryLabel = selectedPath.map(x => x.label).join(' > ');


 function normalizeFilterNumber(value){
   if(value === undefined || value === null || value === '') return null;
   const match = String(value).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
   if(!match) return null;
   const parsed = Number(match[0]);
   return Number.isFinite(parsed) ? parsed : null;
 }

 function getListingFieldValue(item, key){
   if(!item) return undefined;
   const attrs = item.attributes || {};
   return item[key] ?? attrs[key] ?? attrs[`${key}Value`] ?? attrs[`${key}_value`];
 }

 function advancedFiltersMatch(item){
   const entries = Object.entries(advancedFilters || {}).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');
   if(!entries.length) return true;

   return entries.every(([key, rawValue]) => {
     if(key.endsWith('Min') || key.endsWith('Max')) {
       const baseKey = key.replace(/(Min|Max)$/, '');
       const itemValue = normalizeFilterNumber(getListingFieldValue(item, baseKey));
       const filterValue = normalizeFilterNumber(rawValue);
       if(filterValue === null) return true;
       if(itemValue === null) return false;
       return key.endsWith('Min') ? itemValue >= filterValue : itemValue <= filterValue;
     }

     const itemValue = getListingFieldValue(item, key);
     if(itemValue === undefined || itemValue === null) return false;
     return String(itemValue).toLowerCase() === String(rawValue).toLowerCase();
   });
 }

 function categoryMatchesListing(item){
   if(!selectedCategoryId) return true;
   const allowedIds = new Set(getDescendantCategoryIds(selectedCategoryId));
   const normalizeMatchText = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
   const attributeText = Object.values(item.attributes || {}).filter((value) => typeof value !== 'object').join(' ');
   const categorySignal = [
     item.category,
     item.subcategory,
     item.categoryLabel,
     item.category_label,
     item.brand,
     item.model,
     item.title,
     item.description,
     attributeText,
   ].filter(Boolean);
   const hasCategoryMetadata = item.categoryId || item.subcategoryId || item.category || item.subcategory || item.categoryLabel || item.category_label;
   if(!hasCategoryMetadata) return true;
   const text = normalizeMatchText(categorySignal.join(' '));
   const labels = selectedPath.map(x => normalizeMatchText(x.label));
   const selectedNodeLabel = normalizeMatchText(selectedCategory?.node?.label);
   return allowedIds.has(item.categoryId)
     || allowedIds.has(item.subcategoryId)
     || (selectedNodeLabel && text.includes(selectedNodeLabel))
     || labels.some(label => text.includes(label));
 }

 const filtered=useMemo(()=>approved.filter((item) => categoryMatchesListing(item) && advancedFiltersMatch(item)),[approved, selectedCategoryId, advancedFilters]);

 async function handleCreate(payload){
   if(!user){
     setShowCreate(false);
     setShowAuth(true);
     alert('İlan vermek için önce giriş yapmalısın.');
     return;
   }
   try{
     await createListing({...payload,user_id:user.id});
     setShowCreate(false);
     alert('İlan kaydedildi. Admin onayından sonra yayına çıkacak.');
     await refreshListings();
   }catch(error){
     console.warn(error);
     alert(error.message || 'İlan kaydedilemedi. Veritabanı kolonlarını ve RLS yetkilerini kontrol et.');
   }
 }

 async function approve(id){try{await approveListing(id); await refreshListings()}catch(e){alert(e.message || 'Onaylama başarısız. Admin yetkisi/RLS kontrol et.')}}
 async function reject(id,note=''){try{await rejectListing(id,note); await refreshListings()}catch(e){alert(e.message || 'Reddetme başarısız. Admin yetkisi/RLS kontrol et.')}}
 async function del(id){try{await deleteListing(id); await refreshListings()}catch(e){alert(e.message || 'Silme başarısız. Admin yetkisi/RLS kontrol et.')}}
 async function feature(id){try{const item=listings.find(x=>x.id===id); await toggleFeaturedListing(id,!item?.isFeatured); await refreshListings()}catch(e){alert(e.message || 'Öne çıkarma başarısız. Admin yetkisi/RLS kontrol et.')}}

 
 function scrollToListings(){
   setTimeout(() => listingsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
 }

 function handleSidebarCategory(node){
   if(!node){
     setSelectedCategoryId(null);
     setAdvancedFilters({});
     setCategory('Tümü');
     scrollToListings();
     return;
   }
   if(node.children?.length) return;
   const found = findCategoryNode(node.id);
   const label = found ? found.path.map(x => x.label).join(' > ') : node.label;
   setSelectedCategoryId(node.id);
   setAdvancedFilters({});
   setCategory(label);
   scrollToListings();
 }

 async function startChatForListing(listing){
   if(!user){
     setShowAuth(true);
     alert('Mesaj göndermek için önce giriş yapmalısın.');
     return;
   }

   if(!listing?.user_id){
     alert('Bu ilanın satıcı bilgisi eksik. İlanı yeniden onaylaman veya veritabanını kontrol etmen gerekebilir.');
     return;
   }

   try{
     const conversation = await getOrCreateConversation({ listingId: listing.id, buyerId: user.id, sellerId: listing.user_id });
     setActiveConversation(conversation);
   }catch(error){
     alert(error.message || 'Sohbet başlatılamadı.');
   }
 }

 return <div className="min-h-screen overflow-x-hidden bg-slate-100 pb-24 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white md:pb-0">
  <Header
    user={user}
    isAdmin={isAdmin}
    onAuth={() => setShowAuth(true)}
    onLogout={async()=>{
      await supabase.auth.signOut();
      setUser(null); setProfile(null); setIsAdmin(false); setShowAdmin(false); setNotificationCount(0);
    }}
    onCreate={()=>setShowCreate(true)}
    onPricing={()=>setShowPricing(true)}
    onAdmin={()=>{ if(!isAdmin){ alert('Admin yetkin yok.'); return; } setShowAdmin(true); }}
    onMyListings={()=>setShowMyListings(true)}
    onMessages={()=> user ? setShowMessages(true) : setShowAuth(true)}
    onFavorites={()=> user ? setShowFavorites(true) : setShowAuth(true)}
    onNotifications={()=> user ? setShowNotifications(true) : setShowAuth(true)}
    notificationCount={notificationCount}
    searchQuery={query}
    onSearchQueryChange={setQuery}
    onSearchSubmit={() => { refreshListings(); scrollToListings(); }}
    theme={theme}
    onToggleTheme={toggleTheme}
  />

  <main className="mx-auto flex w-full max-w-[1500px] gap-5 px-2 py-3 sm:px-3 md:px-5 md:py-4">
    <MarketplaceSidebar selectedCategoryId={selectedCategoryId} onSelectCategory={handleSidebarCategory} categoryCounts={categoryCounts} />

    <div className="min-w-0 flex-1">
      <section className="relative overflow-hidden rounded-2xl border border-white/60 bg-white shadow-xl shadow-slate-200/70 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/30 sm:rounded-3xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/35 to-white/10 dark:from-slate-950/90 dark:via-slate-950/65 dark:to-slate-950/25" />
        <div className="relative p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl py-3 md:py-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-black text-cyan-700 ring-1 ring-white/70 backdrop-blur dark:bg-cyan-400/10 dark:text-cyan-200 dark:ring-cyan-300/20">
              <ShieldCheck size={14}/> NouMarket güvenli ilan pazaryeri
            </div>
            <h1 className="mt-4 max-w-2xl font-serif text-3xl font-black leading-tight text-white sm:text-4xl md:text-6xl">Nouméa’da Yeni Fırsatlar Sizi Bekliyor</h1>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/90 md:text-base">Güvenilir topluluk pazaryeri NouMarket’te emlak, araç, elektronik ve yerel hizmetleri keşfet.</p>

            <div className="mt-6 max-w-4xl rounded-2xl bg-white/92 p-2 shadow-2xl shadow-slate-950/20 ring-1 ring-white/70 backdrop-blur dark:bg-slate-900/88 dark:ring-white/10">
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_190px_190px_96px]">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                  <Search className="text-slate-400 dark:text-slate-300" size={20}/>
                  <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ne arıyorsunuz?" className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-400" />
                </div>
                <select value={category} onChange={e=>setCategory(e.target.value)} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-white/10">
                  <option value="Tümü">Tüm Kategoriler</option>
                  {CATEGORY_TREE.map((item)=><option key={item.id} value={item.label}>{item.label}</option>)}
                </select>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                  <MapPin size={17} className="text-cyan-600" />
                  <select value={location} onChange={e=>setLocation(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none dark:bg-slate-900 dark:text-white">
                    {LOCATION_OPTIONS.map(x=><option key={x}>{x}</option>)}
                  </select>
                </div>
                <button onClick={() => refreshListings()} className="rounded-xl bg-cyan-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-cyan-600/25 hover:bg-cyan-700">Ara</button>
              </div>
            </div>

            <div className="mt-4 grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                [CreditCard, 'Güvenli Ödeme Sistemi'],
                [BadgeCheck, 'Doğrulanmış Satıcılar'],
                [Headphones, '7/24 Destek'],
                [Users, 'Yerel Topluluk'],
                [Tag, 'Kolay İlan Verme'],
              ].map(([Icon, label]) => (
                <div key={label} className="flex items-center gap-2 rounded-2xl bg-white/75 px-3 py-3 text-xs font-bold text-slate-700 ring-1 ring-white/60 backdrop-blur dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200"><Icon size={16} /></span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/85 sm:mt-4 sm:rounded-3xl sm:p-4 lg:hidden">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-black dark:text-white">Kategoriler</h2><button onClick={()=>handleSidebarCategory(null)} className="text-xs font-black text-cyan-600 dark:text-cyan-300">Tümü</button></div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORY_TREE.map((item)=><button key={item.id} onClick={()=>handleSidebarCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ring-1 ${selectedCategoryId===item.id?'bg-cyan-600 text-white ring-cyan-600':'bg-white text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10'}`}>{item.icon} {item.label}</button>)}
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/85 sm:mt-4 sm:rounded-3xl sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black dark:text-white">Popüler Kategoriler</h2>
          <button onClick={()=>handleSidebarCategory(null)} className="shrink-0 text-xs font-black text-cyan-600 dark:text-cyan-300 sm:text-sm">Tümü →</button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-6 xl:grid-cols-8">
          {CATEGORY_TREE.slice(0,8).map((item)=><button key={item.id} onClick={()=>handleSidebarCategory(item)} className="group rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-100 hover:bg-cyan-50 hover:ring-cyan-100 dark:bg-white/5 dark:ring-white/10 dark:hover:bg-cyan-400/10 sm:rounded-3xl sm:p-4"><div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-white text-lg shadow-sm dark:bg-white/10 sm:h-12 sm:w-12 sm:text-xl">{item.icon}</div><div className="mt-2 truncate text-xs font-black text-slate-700 group-hover:text-cyan-700 dark:text-slate-200 dark:group-hover:text-cyan-200">{item.label}</div></button>)}
        </div>
      </section>

      {selectedCategory && (
        <section className="mt-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-3 py-3 shadow-sm dark:border-cyan-300/20 dark:bg-cyan-400/10 sm:mt-4 sm:rounded-3xl sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-wide text-cyan-600 dark:text-cyan-300">Aktif kategori</div>
              <div className="mt-1 truncate text-sm font-black text-slate-900 dark:text-white">{selectedPath.map((item) => item.label).join(' › ')}</div>
            </div>
            <button onClick={() => handleSidebarCategory(null)} className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10">Seçimi temizle</button>
          </div>
        </section>
      )}

      {approved.filter(x=>x.isFeatured).length>0 && (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/85 sm:rounded-3xl sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2"><h2 className="text-lg font-black dark:text-white">Öne Çıkan İlanlar</h2><span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200">Premium</span></div>
            <button onClick={()=>setShowPricing(true)} className="text-sm font-black text-cyan-600 dark:text-cyan-300">Tümünü Gör</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 sm:gap-4">
            {approved.filter(x=>x.isFeatured).slice(0,8).map(item=><div key={item.id} className="min-w-[78vw] max-w-[78vw] sm:min-w-[250px] sm:max-w-[250px]"><ListingCard item={item} onClick={()=>setSelected(item)}/></div>)}
          </div>
        </section>
      )}

      <div ref={listingsSectionRef} className="scroll-mt-24" />
      <SearchFilters
        query={query} setQuery={setQuery} category={category} setCategory={setCategory}
        location={location} setLocation={setLocation} minPrice={minPrice} setMinPrice={setMinPrice}
        maxPrice={maxPrice} setMaxPrice={setMaxPrice} sort={sort} setSort={setSort}
        selectedCategory={selectedCategory} advancedFilters={advancedFilters} setAdvancedFilters={setAdvancedFilters} onSearch={refreshListings}
        onClear={()=>{ setQuery(''); setCategory('Tümü'); setSelectedCategoryId(null); setAdvancedFilters({}); setLocation('Tümü'); setMinPrice(''); setMaxPrice(''); setSort('newest'); refreshListings({ query: '', category: 'Tümü', location: 'Tümü', minPrice: '', maxPrice: '', sort: 'newest' }); }}
      />

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/85 sm:rounded-3xl sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black dark:text-white">Son İlanlar</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{loadingListings && approved.length === 0 ? 'İlanlar yükleniyor...' : `${filtered.length} ilan gösteriliyor`}{selectedCategoryLabel ? ` • ${selectedCategoryLabel}` : ''}</p>
          </div>
          {isAdmin && <button onClick={()=>setShowAdmin(true)} className="rounded-full bg-amber-50 px-4 py-2 text-xs font-black text-amber-700 ring-1 ring-amber-200">{pending.length} onay bekliyor</button>}
        </div>
        {loadingListings && approved.length === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-[310px] animate-pulse rounded-3xl bg-slate-100 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-white/10 dark:bg-white/5 sm:rounded-3xl sm:p-8">
            <div className="text-lg font-black text-slate-900 dark:text-white">Bu filtrelerde ilan bulunamadı</div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Kategori veya fiyat filtresini genişletip tekrar dene.</p>
            <button onClick={() => { setQuery(''); setCategory('Tümü'); setSelectedCategoryId(null); setAdvancedFilters({}); setLocation('Tümü'); setMinPrice(''); setMaxPrice(''); setSort('newest'); refreshListings({ query: '', category: 'Tümü', location: 'Tümü', minPrice: '', maxPrice: '', sort: 'newest' }); }} className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Filtreleri temizle</button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {filtered.map(item=><ListingCard key={item.id} item={item} onClick={()=>setSelected(item)}/>) }
          </div>
        )}
      </section>
    </div>
  </main>

  <BottomNav onCreate={()=>setShowCreate(true)} onMessages={()=>setShowMessages(true)} onMyListings={()=>setShowMyListings(true)} onNotifications={()=>setShowNotifications(true)} />

  {showAuth&&<AuthModal onClose={async()=>{setShowAuth(false); const {data}=await supabase.auth.getUser(); setUser(data.user ?? null); await refreshProfile(data.user ?? null)}}/>}
  {showCreate&&<ListingForm user={user} profile={profile} onClose={()=>setShowCreate(false)} onCreate={handleCreate}/>}  
  {showAdmin&&isAdmin&&<AdminPanel listings={listings} onApprove={approve} onReject={reject} onDelete={del} onFeature={feature} onClose={()=>setShowAdmin(false)}/>}  
  {showPricing&&<PricingModal onClose={()=>setShowPricing(false)}/>}  
  {showMyListings&&(<MyListingsModal user={user} onClose={()=>setShowMyListings(false)} />)}
  {showMessages&&(<MessagesModal user={user} onClose={()=>setShowMessages(false)} onOpenConversation={(conversation)=>{ setShowMessages(false); setActiveConversation(conversation); }} />)}
  {showFavorites&&(<FavoritesModal user={user} onClose={()=>setShowFavorites(false)} onOpenListing={(listing)=>{ setShowFavorites(false); setSelected(listing); }} />)}
  {showNotifications&&(<NotificationsModal user={user} onClose={async()=>{ setShowNotifications(false); await refreshNotifications(); }} />)}
  {activeConversation&&(<ChatModal user={user} conversation={activeConversation} onClose={()=>setActiveConversation(null)} />)}
  {selected&&(<ListingDetailModal selected={selected} user={user} onClose={()=>setSelected(null)} onStartChat={()=>startChatForListing(selected)} />)}
 </div>;
}
