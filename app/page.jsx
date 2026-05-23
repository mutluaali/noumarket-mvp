'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, SlidersHorizontal } from 'lucide-react';
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
import OffersModal from '@/components/OffersModal';
import SavedSearchesModal from '@/components/SavedSearchesModal';
import ProfileModal from '@/components/ProfileModal';
import ResultsToolbar from '@/components/ResultsToolbar';
import ListingListRow from '@/components/ListingListRow';
import CompareBar from '@/components/CompareBar';
import CompareModal from '@/components/CompareModal';
import TrustStrip from '@/components/TrustStrip';
import MarketplaceDiscovery from '@/components/MarketplaceDiscovery';
import BottomNav from '@/components/BottomNav';
import FeedbackModal from '@/components/FeedbackModal';
import InstallAppPrompt from '@/components/InstallAppPrompt';
import OnboardingModal from '@/components/OnboardingModal';
import ActivationNudges from '@/components/ActivationNudges';
import DeployChecklist from '@/components/DeployChecklist';
import ListingSkeleton from '@/components/ListingSkeleton';
import EmptyState from '@/components/EmptyState';
import RecentlyViewed from '@/components/RecentlyViewed';
import { createSavedSearch } from '@/lib/savedSearches';
import { hasCompletedOnboarding, markActivationEvent } from '@/lib/onboarding';
import { getOrCreateConversation } from '@/lib/messages';
import { getFavoriteIds, toggleFavorite } from '@/lib/favorites';
import { demoListings, formatXpf } from '@/lib/demoData';
import { supabase, getStableSession } from '@/lib/supabase';
import { getCurrentProfile, userIsAdmin } from '@/lib/profiles';
import { getApprovedListings, getAdminListings, createListing, approveListing, rejectListing, deleteListing, toggleFeaturedListing, normalizeListing } from '@/lib/listings';
import { trackEvent } from '@/lib/analytics';

export default function HomePage(){
 const router = useRouter();
 const [listings,setListings]=useState([]);
 const [loadingListings,setLoadingListings]=useState(true);
 const [user,setUser]=useState(null);
 const [profile,setProfile]=useState(null);
 const [isAdmin,setIsAdmin]=useState(false);
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('Tümü');
 const [subcategory,setSubcategory]=useState('Tümü');
 const [location,setLocation]=useState('Tümü');
 const [minPrice,setMinPrice]=useState('');
 const [maxPrice,setMaxPrice]=useState('');
 const [sort,setSort]=useState('newest');
 const [viewMode,setViewMode]=useState('gallery');
 const [autoSearch,setAutoSearch]=useState(true);
 const [mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
 const [selected,setSelected]=useState(null);
 const [showAuth,setShowAuth]=useState(false);
 const [showCreate,setShowCreate]=useState(false);
 const [showAdmin,setShowAdmin]=useState(false);
 const [showPricing,setShowPricing]=useState(false);
 const [showMyListings,setShowMyListings]=useState(false);
 const [showMessages,setShowMessages]=useState(false);
 const [showFavorites,setShowFavorites]=useState(false);
 const [showNotifications,setShowNotifications]=useState(false);
 const [showOffers,setShowOffers]=useState(false);
 const [showSavedSearches,setShowSavedSearches]=useState(false);
 const [showProfile,setShowProfile]=useState(false);
 const [showFeedback,setShowFeedback]=useState(false);
 const [showOnboarding,setShowOnboarding]=useState(false);
 const [notificationCount,setNotificationCount]=useState(0);
 const [favoriteIds,setFavoriteIds]=useState([]);
 const [compareIds,setCompareIds]=useState([]);
 const [showCompare,setShowCompare]=useState(false);
 const latestListingsRequest = useRef(0);
 const mountedRef = useRef(true);

 useEffect(() => {
   mountedRef.current = true;
   return () => { mountedRef.current = false; };
 }, []);

 // Eski PWA/service-worker cache'i production'da eski bundle çalıştırıyordu.
 // Bu temizlik bir kez yapılır ve eski JS/cache kilitlerini kırar.
 useEffect(() => {
   if (typeof window === 'undefined') return;

   const cleanupKey = 'noumarket_cache_cleanup_v4';

   async function cleanupOldCaches() {
     if (window.localStorage.getItem(cleanupKey) === 'done') return;

     window.localStorage.setItem(cleanupKey, 'done');

     try {
       if ('serviceWorker' in navigator) {
         const registrations = await navigator.serviceWorker.getRegistrations();
         await Promise.all(registrations.map((registration) => registration.unregister()));
       }

       if ('caches' in window) {
         const cacheNames = await caches.keys();
         await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
       }
     } catch (error) {
       console.error('cache cleanup error:', error);
     }

     window.location.reload();
   }

   cleanupOldCaches();
 }, []);

 useEffect(() => {
   if (typeof window === 'undefined') return;
   if (!hasCompletedOnboarding()) {
     const timer = setTimeout(() => setShowOnboarding(true), 700);
     return () => clearTimeout(timer);
   }
 }, []);

 useEffect(() => {
   trackEvent('page_view', { source: 'home' }, user?.id || null);
 }, [user?.id]);

 const [activeConversation,setActiveConversation]=useState(null);

 async function refreshProfile(currentUser){
   if(!currentUser?.id){
     setProfile(null);
     setIsAdmin(false);
     setShowAdmin(false);
     return;
   }

   const nextProfile = await getCurrentProfile(currentUser.id);
   setProfile(nextProfile);
   setIsAdmin(userIsAdmin(nextProfile));
 }

 const refreshListings = useCallback(async () => {
   const requestId = latestListingsRequest.current + 1;
   latestListingsRequest.current = requestId;

   if (mountedRef.current) setLoadingListings(true);

   try{
     const data = showAdmin && isAdmin
       ? await getAdminListings()
       : await getApprovedListings({ query, category, location, minPrice, maxPrice, sort });

     if (!mountedRef.current || requestId !== latestListingsRequest.current) return;
     setListings((data || []).map(normalizeListing));
   }catch(error){
     if (!mountedRef.current || requestId !== latestListingsRequest.current) return;
     console.warn('refreshListings warning:', error);
     setListings([]);
   }finally{
     if (mountedRef.current && requestId === latestListingsRequest.current) {
       setLoadingListings(false);
     }
   }
 }, [showAdmin, isAdmin, query, category, location, minPrice, maxPrice, sort]);

 async function refreshFavorites(currentUser = user){
   if(!currentUser?.id){
     setFavoriteIds([]);
     return;
   }

   try{
     setFavoriteIds(await getFavoriteIds(currentUser.id));
   }catch(error){
     console.error('favorite refresh error:', error);
     setFavoriteIds([]);
   }
 }

 async function refreshNotifications(currentUser = user){
   if(!currentUser?.id || !supabase){
     setNotificationCount(0);
     return;
   }

   const { count, error } = await supabase
     .from('notifications')
     .select('id', { count: 'exact', head: true })
     .eq('user_id', currentUser.id)
     .eq('is_read', false);

   if(error){
     console.warn(error);
     setNotificationCount(0);
     return;
   }

   setNotificationCount(count || 0);
 }

 useEffect(()=>{
   let alive = true;

   async function bootAuth(){
     try{
       const session = await getStableSession();
       const currentUser = session?.user ?? null;

       if(!alive) return;

       setUser(currentUser);
       await refreshProfile(currentUser);
       await refreshNotifications(currentUser);
       await refreshFavorites(currentUser);
       await refreshListings();
     }catch(error){
       console.warn('auth boot warning:', error);
       if(!alive) return;
       setUser(null);
       setProfile(null);
       setIsAdmin(false);
       await refreshListings();
     }
   }

   bootAuth();

   const {data:listener} = supabase
     ? supabase.auth.onAuthStateChange(async (_event,session)=>{
         const currentUser = session?.user ?? null;

         setUser(currentUser);
         await refreshProfile(currentUser);
         await refreshNotifications(currentUser);
         await refreshFavorites(currentUser);
         await refreshListings();
       })
     : { data: null };

   return ()=>{
     alive = false;
     listener?.subscription?.unsubscribe?.();
   };
 },[]);

 useEffect(()=>{
   if(showAdmin && isAdmin) refreshListings();
 }, [showAdmin, isAdmin, refreshListings]);

 useEffect(()=>{
   if(!autoSearch) return;
   if(showAdmin && isAdmin) return;
   const timer = setTimeout(()=>refreshListings(), 350);
   return ()=>clearTimeout(timer);
 },[query,category,subcategory,location,minPrice,maxPrice,sort,autoSearch,showAdmin,isAdmin,refreshListings]);

 const approved = useMemo(() => listings.filter((x) => x.status === 'approved'), [listings]);
 const pending = useMemo(() => listings.filter((x) => x.status === 'pending'), [listings]);
 const locations = useMemo(() => ['Tümü', ...Array.from(new Set(approved.map((x) => x.location).filter(Boolean)))], [approved]);

 const stats=useMemo(()=>{
   const totalViews=approved.reduce((a,x)=>a+(x.views||0),0);
   const featured=approved.filter(x=>x.isFeatured).length;
   return {totalViews,featured,estimatedRevenue:featured*1500};
 },[approved]);

 function clearFilters(){
   setQuery('');
   setCategory('Tümü');
   setSubcategory('Tümü');
   setLocation('Tümü');
   setMinPrice('');
   setMaxPrice('');
   setSort('newest');
 }

 async function handleSaveSearch(){
   if(!user){
     setShowAuth(true);
     alert('Arama kaydetmek için önce giriş yapmalısın.');
     return;
   }

   try{
     await createSavedSearch(user.id, { query, category, subcategory, location, minPrice, maxPrice, sort });
     alert('Arama kaydedildi. Yeni eşleşmeler için alarm altyapısı hazır.');
     setShowSavedSearches(true);
   }catch(error){
     alert(error.message || 'Arama kaydedilemedi. Supabase SQL dosyasını çalıştırdığını kontrol et.');
   }
 }

 function applySavedSearch(filters){
   setQuery(filters.query || '');
   setCategory(filters.category || 'Tümü');
   setSubcategory(filters.subcategory || 'Tümü');
   setLocation(filters.location || 'Tümü');
   setMinPrice(filters.minPrice || '');
   setMaxPrice(filters.maxPrice || '');
   setSort(filters.sort || 'newest');
   setTimeout(()=>refreshListings(), 0);
 }

 function applySmartSearchIntent(intent){
   setQuery(intent.query || '');
   setCategory(intent.category || 'Tümü');
   setSubcategory(intent.subcategory || 'Tümü');
   setLocation(intent.location || 'Tümü');
   setMinPrice(intent.minPrice || '');
   setMaxPrice(intent.maxPrice || '');
   setSort(intent.sort || 'newest');
 }

 const filtered=useMemo(()=>{
   let result = [...approved];

   const normalizedQuery = query.trim().toLowerCase();

   if(normalizedQuery){
     result = result.filter((item)=>{
       const haystack = [
         item.title,
         item.description,
         item.category,
         item.location,
         item.seller,
       ].join(' ').toLowerCase();

       return haystack.includes(normalizedQuery);
     });
   }

   if(category !== 'Tümü'){
     result = result.filter((item)=>item.category === category);
   }

   if(subcategory !== 'Tümü'){
     const normalizedSub = String(subcategory).trim().toLowerCase();
     result = result.filter((item)=>{
       const values = [
         item.subcategory,
         item.metadata?.brand,
         item.metadata?.model,
         item.metadata?.property_type,
         item.metadata?.marine_type,
       ].filter(Boolean).map((value)=>String(value).trim().toLowerCase());
       return values.includes(normalizedSub);
     });
   }

   if(location !== 'Tümü'){
     result = result.filter((item)=>item.location === location);
   }

   if(minPrice){
     const min = Number(minPrice);
     if(!Number.isNaN(min)){
       result = result.filter((item)=>Number(item.price || 0) >= min);
     }
   }

   if(maxPrice){
     const max = Number(maxPrice);
     if(!Number.isNaN(max)){
       result = result.filter((item)=>Number(item.price || 0) <= max);
     }
   }

   if(sort === 'price_asc'){
     result.sort((a,b)=>Number(a.price || 0)-Number(b.price || 0));
   }else if(sort === 'price_low'){
     result.sort((a,b)=>Number(a.price || 0)-Number(b.price || 0));
   }else if(sort === 'price_desc'){
     result.sort((a,b)=>Number(b.price || 0)-Number(a.price || 0));
   }else if(sort === 'price_high'){
     result.sort((a,b)=>Number(b.price || 0)-Number(a.price || 0));
   }else if(sort === 'popular'){
     result.sort((a,b)=>Number(b.views || 0)-Number(a.views || 0));
   }else{
     result.sort((a,b)=>new Date(b.created_at || 0)-new Date(a.created_at || 0));
   }

   result.sort((a,b)=>Number(b.isFeatured)-Number(a.isFeatured));

   return result;
 },[approved,query,category,subcategory,location,minPrice,maxPrice,sort]);

 async function handleCreate(payload){
   if(!user){
     setShowCreate(false);
     setShowAuth(true);
     alert('İlan vermek için önce giriş yapmalısın.');
     return;
   }
   try{
     await createListing({...payload,user_id:user.id});
     await trackEvent('listing_create', { category: payload.category, location: payload.location, price: payload.price }, user.id);
     setShowCreate(false);
     alert('İlan kaydedildi. Admin onayından sonra yayına çıkacak.');
     await refreshListings();
   }catch(error){
     console.warn(error);
     alert(error.message || 'İlan kaydedilemedi.');
   }
 }

 async function approve(id){try{await approveListing(id); await refreshListings()}catch(e){alert(e.message || 'Onaylama başarısız. Admin yetkisi/RLS kontrol et.')}}
 async function reject(id){try{await rejectListing(id); await refreshListings()}catch(e){alert(e.message || 'Reddetme başarısız. Admin yetkisi/RLS kontrol et.')}}
 async function del(id){try{await deleteListing(id); await refreshListings()}catch(e){alert(e.message || 'Silme başarısız. Admin yetkisi/RLS kontrol et.')}}
 async function feature(id){try{const item=listings.find(x=>x.id===id); await toggleFeaturedListing(id,!item?.isFeatured); await refreshListings()}catch(e){alert(e.message || 'Öne çıkarma başarısız. Admin yetkisi/RLS kontrol et.')}}


 function toggleCompare(listing){
   setCompareIds((current)=>{
     if(current.includes(listing.id)) return current.filter((id)=>id!==listing.id);
     if(current.length >= 4){
       alert('Karşılaştırma için en fazla 4 ilan seçebilirsin.');
       return current;
     }
     return [...current, listing.id];
   });
 }

 const compareItems = useMemo(()=>{
   return compareIds.map((id)=>approved.find((item)=>item.id===id)).filter(Boolean);
 },[compareIds, approved]);

 async function handleFavorite(listing){
   if(!user){
     setShowAuth(true);
     alert('Favorilere eklemek için önce giriş yapmalısın.');
     return;
   }

   const isCurrentlyFavorite = favoriteIds.includes(listing.id);

   try{
     const nextValue = await toggleFavorite(user.id, listing.id, isCurrentlyFavorite);
     if(nextValue) markActivationEvent('favorite');
     await trackEvent(nextValue ? 'favorite_add' : 'favorite_remove', { listing_id: listing.id, category: listing.category, price: listing.price }, user.id);
     setFavoriteIds((current)=>{
       if(nextValue) return Array.from(new Set([...current, listing.id]));
       return current.filter((id)=>id!==listing.id);
     });
   }catch(error){
     alert(error.message || 'Favori işlemi başarısız.');
   }
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
     const conversation = await getOrCreateConversation({
       listingId: listing.id,
       buyerId: user.id,
       sellerId: listing.user_id,
     });
     markActivationEvent('message');
     await trackEvent('message_start', { listing_id: listing.id, seller_id: listing.user_id }, user.id);
     setActiveConversation(conversation);
   }catch(error){
     alert(error.message || 'Sohbet başlatılamadı.');
   }
 }

 return <div id="top" className="min-h-screen bg-slate-50 pb-24 text-slate-900 lg:pb-0">
  <Header
    user={user}
    isAdmin={isAdmin}
    onAuth={()=>{trackEvent('auth_open',{},user?.id); setShowAuth(true)}}
    onLogout={async()=>{
      try {
        await Promise.race([
          supabase.auth.signOut({ scope: 'local' }),
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ]);
      } catch (error) {
        console.error('signOut error:', error);
      }

      try {
        Object.keys(localStorage)
          .filter((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))
          .forEach((key) => localStorage.removeItem(key));
      } catch (error) {
        console.error('local auth cleanup error:', error);
      }

      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setShowAdmin(false);
      setShowMyListings(false);
      setShowMessages(false);
      setShowFavorites(false);
      setShowNotifications(false);
      setShowSavedSearches(false);
      setShowProfile(false);
      setShowFeedback(false);
      setNotificationCount(0);
      setFavoriteIds([]);

      window.location.reload();
    }}
    onCreate={()=>{trackEvent('listing_create_open',{},user?.id); setShowCreate(true)}}
    onPricing={()=>{trackEvent('pricing_open',{},user?.id); setShowPricing(true)}}
    onAdmin={()=>{
      if(!isAdmin){
        alert('Admin yetkin yok.');
        return;
      }
      trackEvent('admin_open',{},user?.id);
      setShowAdmin(true);
    }}
    onMyListings={()=>setShowMyListings(true)}
    onMessages={()=>setShowMessages(true)}
    onFavorites={()=>setShowFavorites(true)}
    onNotifications={()=>setShowNotifications(true)}
    onSavedSearches={()=>setShowSavedSearches(true)}
    onProfile={()=>setShowProfile(true)}
    notificationCount={notificationCount}
    onSearchFocus={()=>document.getElementById('discovery')?.scrollIntoView({ behavior: 'smooth' })}
    searchValue={query}
    onSearchChange={setQuery}
    onSearchSubmit={()=>{document.getElementById('discovery')?.scrollIntoView({ behavior: 'smooth' }); trackEvent('search',{query,category,subcategory,location,minPrice,maxPrice,sort,source:'navbar'},user?.id); refreshListings();}}
  />
  <main>
   <section id="search" className="border-b border-slate-200 bg-white">
    <div className="mx-auto max-w-7xl px-4 py-7 md:py-9">
     <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-end">
      <div className="max-w-3xl">
       <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600"><ShieldCheck size={15}/> Güvenli, sade, yerel ilan pazarı</div>
       <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">Aradığını hızlı bul. İlanını kolay yayınla.</h1>
       <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Arama artık navbar’da tek merkezde. Kategori ve filtreler aşağıdaki tek panelden birlikte çalışır.</p>
      </div>
      <div className="grid grid-cols-3 gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3 text-center">
       <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200"><div className="text-xl font-black text-slate-950">{approved.length}</div><div className="text-xs font-bold text-slate-500">Aktif ilan</div></div>
       <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200"><div className="text-xl font-black text-slate-950">{stats.featured}</div><div className="text-xs font-bold text-slate-500">Premium</div></div>
       <button type="button" onClick={()=>setMobileFiltersOpen(true)} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200 md:hidden"><SlidersHorizontal className="mx-auto mb-1" size={20}/><div className="text-xs font-bold text-slate-500">Filtre</div></button>
       <div className="hidden rounded-2xl bg-white p-3 ring-1 ring-slate-200 md:block"><div className="text-xl font-black text-slate-950">Tek</div><div className="text-xs font-bold text-slate-500">Arama</div></div>
      </div>
     </div>
    </div>
   </section>

   <TrustStrip />
   <MarketplaceDiscovery
    listings={approved}
    filteredCount={filtered.length}
    category={category}
    setCategory={setCategory}
    subcategory={subcategory}
    setSubcategory={setSubcategory}
    location={location}
    setLocation={setLocation}
    minPrice={minPrice}
    setMinPrice={setMinPrice}
    maxPrice={maxPrice}
    setMaxPrice={setMaxPrice}
    sort={sort}
    setSort={setSort}
    locations={locations}
    onSearch={()=>{trackEvent('search',{query,category,subcategory,location,minPrice,maxPrice,sort,source:'discovery'},user?.id); refreshListings();}}
    onClear={clearFilters}
    onSaveSearch={handleSaveSearch}
    mobileOpen={mobileFiltersOpen}
    onCloseMobile={()=>setMobileFiltersOpen(false)}
   />

   <section className="mx-auto max-w-7xl px-4 py-8">
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
     <div><h2 className="text-2xl font-black">Son ilanlar</h2><p className="mt-1 text-sm text-slate-500">{loadingListings?'İlanlar yükleniyor...':`${filtered.length} ilan gösteriliyor`}</p></div>
     <button onClick={()=>setShowCreate(true)} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-sm sm:hidden">İlan ver</button>
    </div>

    <ResultsToolbar
      count={filtered.length}
      viewMode={viewMode}
      setViewMode={setViewMode}
      autoSearch={autoSearch}
      setAutoSearch={setAutoSearch}
      onOpenFilters={()=>setMobileFiltersOpen(true)}
    />

    {loadingListings ? (
     <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2,3,4,5].map((x)=><ListingSkeleton key={x}/>)}</div>
    ) : filtered.length ? (
     viewMode === 'list' ? (
      <div className="grid gap-4">{filtered.map(item=><ListingListRow key={item.id} item={item} onClick={()=>{trackEvent('listing_detail_view',{listing_id:item.id,category:item.category,price:item.price},user?.id); router.push(`/ilan/${item.id}`)}} onFavorite={handleFavorite} isFavorite={favoriteIds.includes(item.id)} onCompare={toggleCompare} isCompared={compareIds.includes(item.id)}/>)}</div>
     ) : viewMode === 'classic' ? (
      <div className="grid gap-4 lg:grid-cols-2">{filtered.map(item=><ListingListRow key={item.id} item={item} onClick={()=>{trackEvent('listing_detail_view',{listing_id:item.id,category:item.category,price:item.price},user?.id); router.push(`/ilan/${item.id}`)}} onFavorite={handleFavorite} isFavorite={favoriteIds.includes(item.id)} onCompare={toggleCompare} isCompared={compareIds.includes(item.id)}/>)}</div>
     ) : (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(item=><ListingCard key={item.id} item={item} onClick={()=>{trackEvent('listing_detail_view',{listing_id:item.id,category:item.category,price:item.price},user?.id); router.push(`/ilan/${item.id}`)}} onFavorite={handleFavorite} isFavorite={favoriteIds.includes(item.id)} onCompare={toggleCompare} isCompared={compareIds.includes(item.id)}/>)}</div>
     )
    ) : (
     <EmptyState onClear={clearFilters} onCreate={()=>setShowCreate(true)} />
    )}
   </section>
   <DeployChecklist />
  </main>
  {user&&(
    <button
      onClick={()=>setShowOffers(true)}
      className="fixed bottom-40 right-4 z-40 hidden rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-2xl ring-4 ring-white/70 transition hover:-translate-y-0.5 hover:bg-emerald-800 lg:block"
    >
      Tekliflerim
    </button>
  )}
  <button
    onClick={()=>setShowFeedback(true)}
    className="fixed bottom-24 right-4 z-40 hidden rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-2xl ring-4 ring-white/70 transition hover:-translate-y-0.5 hover:bg-slate-800 lg:block"
  >
    Beta feedback
  </button>
  <InstallAppPrompt />
  <BottomNav
    user={user}
    notificationCount={notificationCount}
    onCreate={()=>setShowCreate(true)}
    onMessages={()=>user ? setShowMessages(true) : setShowAuth(true)}
    onProfile={()=>user ? setShowProfile(true) : setShowAuth(true)}
    onNotifications={()=>user ? setShowNotifications(true) : setShowAuth(true)}
    onSearchFocus={()=>document.getElementById('discovery')?.scrollIntoView({ behavior: 'smooth' })}
  />
  <CompareBar
    items={compareItems}
    onOpen={()=>setShowCompare(true)}
    onRemove={(id)=>setCompareIds((current)=>current.filter((itemId)=>itemId!==id))}
    onClear={()=>setCompareIds([])}
  />

  {showOnboarding&&<OnboardingModal onClose={()=>setShowOnboarding(false)} onCreateListing={()=>setShowCreate(true)} />}
  {showAuth&&<AuthModal
    onClose={()=>setShowAuth(false)}
    onAuthenticated={async(currentUser)=>{
      setUser(currentUser);
      await refreshProfile(currentUser);
      await refreshNotifications(currentUser);
      await refreshFavorites(currentUser);
      await refreshListings();
    }}
  />}
  {showCreate&&<ListingForm onClose={()=>setShowCreate(false)} onCreate={handleCreate} user={user} profile={profile}/>}  
  {showAdmin&&isAdmin&&<AdminPanel listings={listings} onApprove={approve} onReject={reject} onDelete={del} onFeature={feature} onClose={()=>setShowAdmin(false)}/>}  
  {showPricing&&<PricingModal onClose={()=>setShowPricing(false)}/>}  
  {showMyListings&&(
    <MyListingsModal
      user={user}
      onClose={()=>setShowMyListings(false)}
    />
  )}
  {showMessages&&(
    <MessagesModal
      user={user}
      onClose={()=>setShowMessages(false)}
      onOpenConversation={(conversation)=>{
        setShowMessages(false);
        markActivationEvent('message');
     setActiveConversation(conversation);
      }}
    />
  )}
  {showFavorites&&(
    <FavoritesModal
      user={user}
      onClose={()=>setShowFavorites(false)}
      onOpenListing={(listing)=>{
        setShowFavorites(false);
        setSelected(listing);
      }}
    />
  )}

  {showProfile&&user&&(
    <ProfileModal
      user={user}
      profile={profile}
      onClose={()=>setShowProfile(false)}
      onSaved={async()=>{
        await refreshProfile(user);
      }}
    />
  )}
  {showNotifications&&(
    <NotificationsModal
      user={user}
      onClose={async()=>{
        setShowNotifications(false);
        await refreshNotifications();
      }}
    />
  )}
  {showOffers&&user&&(
    <OffersModal user={user} onClose={()=>setShowOffers(false)} />
  )}
  {showSavedSearches&&user&&(
    <SavedSearchesModal
      user={user}
      onClose={()=>setShowSavedSearches(false)}
      onApply={applySavedSearch}
    />
  )}
  {showFeedback&&(
    <FeedbackModal
      user={user}
      onClose={()=>setShowFeedback(false)}
    />
  )}
  {showCompare&&compareItems.length>0&&(
    <CompareModal
      items={compareItems}
      onClose={()=>setShowCompare(false)}
      onOpenListing={(listing)=>{setShowCompare(false); router.push(`/ilan/${listing.id}`)}}
      onStartChat={(listing)=>{setShowCompare(false); startChatForListing(listing)}}
    />
  )}
  {activeConversation&&(
    <ChatModal
      user={user}
      conversation={activeConversation}
      onClose={()=>setActiveConversation(null)}
    />
  )}
  {selected&&(
    <ListingDetailModal
      selected={selected}
      user={user}
      onClose={()=>setSelected(null)}
      onStartChat={()=>startChatForListing(selected)}
    />
  )}
 </div>;
}
