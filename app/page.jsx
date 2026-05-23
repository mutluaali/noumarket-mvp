'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck, Eye, Crown, BarChart3, Globe2, Plus, CreditCard, Sparkles } from 'lucide-react';
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
import SavedSearchesModal from '@/components/SavedSearchesModal';
import ProfileModal from '@/components/ProfileModal';
import SearchFilters from '@/components/SearchFilters';
import ResultsToolbar from '@/components/ResultsToolbar';
import ListingListRow from '@/components/ListingListRow';
import SearchIntentBar from '@/components/SearchIntentBar';
import DopingShowcase from '@/components/DopingShowcase';
import CompareBar from '@/components/CompareBar';
import CompareModal from '@/components/CompareModal';
import AdvancedCategoryFilters from '@/components/AdvancedCategoryFilters';
import SmartFeed from '@/components/SmartFeed';
import CategoryShowcase from '@/components/CategoryShowcase';
import TrustStrip from '@/components/TrustStrip';
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
 const [showSavedSearches,setShowSavedSearches]=useState(false);
 const [showProfile,setShowProfile]=useState(false);
 const [showFeedback,setShowFeedback]=useState(false);
 const [showOnboarding,setShowOnboarding]=useState(false);
 const [notificationCount,setNotificationCount]=useState(0);
 const [favoriteIds,setFavoriteIds]=useState([]);
 const [compareIds,setCompareIds]=useState([]);
 const [showCompare,setShowCompare]=useState(false);

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

 async function refreshListings(){
   setLoadingListings(true);
   try{
     const data = showAdmin && isAdmin
       ? await getAdminListings()
       : await getApprovedListings({ query, category, location, minPrice, maxPrice, sort });

     setListings((data || []).map(normalizeListing));
   }catch(error){
     console.warn('refreshListings warning:', error);
     setListings([]);
   }finally{
     setLoadingListings(false);
   }
 }

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
   if(!currentUser?.id){
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

   const {data:listener}=supabase.auth.onAuthStateChange(async (_event,session)=>{
     const currentUser = session?.user ?? null;

     setUser(currentUser);
     await refreshProfile(currentUser);
     await refreshNotifications(currentUser);
     await refreshFavorites(currentUser);
     await refreshListings();
   });

   return ()=>{
     alive = false;
     listener?.subscription?.unsubscribe?.();
   };
 },[]);

 useEffect(()=>{refreshListings()},[showAdmin,isAdmin]);

 useEffect(()=>{
   if(!autoSearch) return;
   if(showAdmin && isAdmin) return;
   const timer = setTimeout(()=>refreshListings(), 350);
   return ()=>clearTimeout(timer);
 },[query,category,location,minPrice,maxPrice,sort,autoSearch]);

 const approved=listings.filter(x=>x.status==='approved');
 const pending=listings.filter(x=>x.status==='pending');
 const locations=['Tümü',...Array.from(new Set(approved.map(x=>x.location)))];

 const stats=useMemo(()=>{
   const totalViews=approved.reduce((a,x)=>a+(x.views||0),0);
   const featured=approved.filter(x=>x.isFeatured).length;
   return {totalViews,featured,estimatedRevenue:featured*1500};
 },[approved]);

 const categoryCounts=useMemo(()=>{
   return approved.reduce((acc,item)=>{
     acc[item.category]=(acc[item.category] || 0) + 1;
     return acc;
   },{});
 },[approved]);

 function clearFilters(){
   setQuery('');
   setCategory('Tümü');
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
     await createSavedSearch(user.id, { query, category, location, minPrice, maxPrice, sort });
     alert('Arama kaydedildi. Yeni eşleşmeler için alarm altyapısı hazır.');
     setShowSavedSearches(true);
   }catch(error){
     alert(error.message || 'Arama kaydedilemedi. Supabase SQL dosyasını çalıştırdığını kontrol et.');
   }
 }

 function applySavedSearch(filters){
   setQuery(filters.query || '');
   setCategory(filters.category || 'Tümü');
   setLocation(filters.location || 'Tümü');
   setMinPrice(filters.minPrice || '');
   setMaxPrice(filters.maxPrice || '');
   setSort(filters.sort || 'newest');
   setTimeout(()=>refreshListings(), 0);
 }

 function applySmartSearchIntent(intent){
   setQuery(intent.query || '');
   setCategory(intent.category || 'Tümü');
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
 },[approved,query,category,location,minPrice,maxPrice,sort]);

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
  />
  <main>
   <section id="search" className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#f8fafc,#eef2ff_48%,#fef3c7)]">
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 md:pb-14 md:pt-14">
     <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div>
       <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-sm font-bold text-slate-700 shadow-sm backdrop-blur"><ShieldCheck size={16}/> Admin onaylı yerel ilan pazarı</div>
       <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Yeni Kaledonya’nın sahibinden.com alternatifi.</h1>
       <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Araç, emlak, elektronik, denizcilik, hizmet ve ikinci el ürünleri tek yerde toplayan modern NouMarket deneyimi.</p>

       <div className="mt-7 rounded-[2rem] bg-white/90 p-3 shadow-2xl ring-1 ring-white/70 backdrop-blur">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
         <div className="flex items-center gap-3 rounded-3xl bg-slate-100 px-4 py-4">
          <Search className="text-slate-500" size={21}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){trackEvent('search',{query,category,location,minPrice,maxPrice,sort},user?.id); refreshListings();}}} placeholder="Hilux, kiralık ev, iPhone, tekne motoru..." className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"/>
         </div>
         <button onClick={()=>{trackEvent('search',{query,category,location,minPrice,maxPrice,sort},user?.id); refreshListings();}} className="rounded-3xl bg-slate-950 px-7 py-4 text-sm font-black text-white shadow-lg hover:bg-slate-800">Ara</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 px-1 pb-1">
         {['Araç','Emlak','Elektronik','Denizcilik'].map((quick)=>(
          <button key={quick} onClick={()=>setCategory(quick)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-900 hover:text-white">{quick}</button>
         ))}
        </div>
       </div>

       <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-white/85 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur"><div className="flex items-center gap-2 text-sm font-bold text-slate-500"><Eye size={16}/> Görüntülenme</div><div className="mt-2 text-2xl font-black">{stats.totalViews}</div></div>
        <div className="rounded-3xl bg-white/85 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur"><div className="flex items-center gap-2 text-sm font-bold text-slate-500"><Crown size={16}/> Premium ilan</div><div className="mt-2 text-2xl font-black">{stats.featured}</div></div>
        <div className="rounded-3xl bg-white/85 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur"><div className="flex items-center gap-2 text-sm font-bold text-slate-500"><BarChart3 size={16}/> Tahmini gelir</div><div className="mt-2 text-2xl font-black">{formatXpf(stats.estimatedRevenue)}</div></div>
       </div>
      </div>

      <div className="relative hidden lg:block">
       <div className="absolute -left-5 -top-5 z-10 rounded-3xl bg-slate-950 px-5 py-4 text-white shadow-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-200"><Sparkles size={15}/> Lokal fırsat</div>
        <div className="mt-1 text-2xl font-black">{approved.length} aktif ilan</div>
       </div>
       <div className="overflow-hidden rounded-[2.4rem] bg-white shadow-2xl ring-1 ring-white/80">
        <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=80" className="h-[455px] w-full object-cover" alt="New Caledonia landscape"/>
        <div className="absolute bottom-6 left-6 right-6 rounded-[2rem] bg-white/90 p-5 shadow-xl backdrop-blur">
         <div className="text-sm font-semibold text-slate-500">Platform özeti</div>
         <div className="mt-1 text-2xl font-black">{approved.length} aktif ilan</div>
         <div className="mt-2 text-sm text-slate-600">{pending.length} ilan onay bekliyor · Admin kontrollü güvenli yayın</div>
        </div>
       </div>
      </div>
     </div>
    </div>
   </section>

   <TrustStrip />
   <SearchIntentBar query={query} setQuery={setQuery} onSearch={refreshListings} onApplyIntent={applySmartSearchIntent} />
   <ActivationNudges
    user={user}
    listingCount={approved.filter((item)=>item.user_id===user?.id).length}
    onCreate={()=>setShowCreate(true)}
    onFavorites={()=>user ? setShowFavorites(true) : setShowAuth(true)}
    onMessages={()=>user ? setShowMessages(true) : setShowAuth(true)}
   />
   <CategoryShowcase activeCategory={category} counts={categoryCounts} onSelect={setCategory} />
   <RecentlyViewed
    listings={approved}
    favoriteIds={favoriteIds}
    onFavorite={handleFavorite}
    onOpen={(item)=>router.push(`/ilan/${item.id}`)}
   />

   <SmartFeed
    listings={approved}
    context={{ query, category, location }}
    favoriteIds={favoriteIds}
    onFavorite={handleFavorite}
    onOpen={(item)=>{trackEvent('smart_feed_click',{listing_id:item.id,category:item.category,score:item.smart_score},user?.id); router.push(`/ilan/${item.id}`)}}
    onCompare={toggleCompare}
    compareIds={compareIds}
   />

   <DopingShowcase onPricing={()=>setShowPricing(true)} />

   <section className="mx-auto max-w-7xl px-4 py-4">
    <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
     <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm"><div className="flex items-center gap-2 text-sm font-bold text-slate-300"><Globe2 size={17}/> Gerçek MVP mimarisi</div><h2 className="mt-2 text-2xl font-black">Supabase + Vercel ile canlıya çıkmaya hazır yapı</h2></div>
     <div className="rounded-[2rem] bg-amber-50 p-6 shadow-sm ring-1 ring-amber-200"><div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800"><Crown size={17}/> Öne çıkan ilan</div><div className="text-2xl font-black">1.500 XPF</div></div>
     <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-500"><CreditCard size={17}/> Mağaza üyeliği</div><div className="text-2xl font-black">9.900 XPF / ay</div></div>
    </div>
   </section>

   <SearchFilters
    query={query}
    setQuery={setQuery}
    category={category}
    setCategory={setCategory}
    location={location}
    setLocation={setLocation}
    minPrice={minPrice}
    setMinPrice={setMinPrice}
    maxPrice={maxPrice}
    setMaxPrice={setMaxPrice}
    sort={sort}
    setSort={setSort}
    locations={locations}
    onSearch={()=>{trackEvent('search',{query,category,location,minPrice,maxPrice,sort,source:'filters'},user?.id); refreshListings();}}
    onClear={clearFilters}
    onSaveSearch={handleSaveSearch}
    compact={!mobileFiltersOpen}
    onCloseMobile={()=>setMobileFiltersOpen(false)}
   />

   <AdvancedCategoryFilters
    category={category}
    onSuggest={()=>alert('Sonraki aşamada kategoriye özel metadata filtrelerini gerçek arama API’sine bağlayacağız.')}
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
    onSearchFocus={()=>document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })}
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
