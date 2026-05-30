'use client';

import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Search, ShieldCheck, Crown, Home, Grid2X2, MessageCircle, UserRound, Plus, MapPin, ArrowRight, Menu, X, CarFront, Building2, Smartphone, Sofa, ChevronDown, Headphones, Globe2, Zap } from 'lucide-react';
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
import ActiveFilterChips from '@/components/ActiveFilterChips';
import ReportListingModal from '@/components/ReportListingModal';
import ProfileModal from '@/components/ProfileModal';
import { getOrCreateConversation } from '@/lib/messages';
import { DEFAULT_LISTINGS_PAGE_SIZE, fetchApprovedListingSummaries, fetchFeaturedListings, searchListings } from '@/lib/search';
import { supabase, hasSupabase, getPublicSupabaseConfigMessage } from '@/lib/supabase';
import { withTimeout, withTimeoutFallback } from '@/lib/safeAsync';
import { getUnreadNotificationCount } from '@/lib/notifications';
import { getCurrentProfile, userIsAdmin, isUserSuspended } from '@/lib/profiles';
import { SUSPENSION_BLOCK_MESSAGE } from '@/lib/suspension';
import { getAdminListings, createListing, approveListing, rejectListing, deleteListing, toggleFeaturedListing, normalizeListing } from '@/lib/listings';
import { CATEGORY_TREE, buildCategoryLabel, findCategoryNode, calculateCategoryCounts } from '@/lib/categorySchema';
import { LOCATION_OPTIONS } from '@/lib/locations';
import MarketplaceSidebar from '@/components/MarketplaceSidebar';
import { getListingEntitlements, normalizeAccountEntitlements } from '@/lib/accountPlans';
import { isPublicListingStatus } from '@/lib/listingStatus';
import { getFavoriteIds, toggleFavorite } from '@/lib/favorites';

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function BottomNav({ onCreate, onMessages, onMyListings, onProfile, onCategories, onHome, user }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 px-2 pb-2 pt-1 shadow-nav backdrop-blur-xl dark:border-white/10 dark:bg-brand-charcoal/95 md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
        <button type="button" onClick={onHome} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-brand-teal dark:text-brand-teal-light"><Home size={20} /> Ana Sayfa</button>
        <button type="button" onClick={onCategories} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2"><Grid2X2 size={20} /> Kategoriler</button>
        <button type="button" onClick={onCreate} className="-mt-7 mx-auto flex h-[58px] w-[58px] flex-col items-center justify-center rounded-full bg-brand-teal text-white shadow-premium ring-4 ring-[var(--background)]"><Plus size={26} strokeWidth={2.5} /></button>
        <button type="button" onClick={onMessages} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2"><MessageCircle size={20} /> Mesajlar</button>
        <button type="button" onClick={user ? onMyListings : onProfile} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2"><UserRound size={20} /> {user ? 'İlanlarım' : 'Hesap'}</button>
      </div>
    </nav>
  );
}

function SectionHeader({ eyebrow, title, action, onAction }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-1 text-[11px] font-black uppercase tracking-[0.22em] text-brand-teal dark:text-brand-teal-light">{eyebrow}</div> : null}
        <h2 className="truncate text-xl font-black text-slate-950 dark:text-white sm:text-2xl">{title}</h2>
      </div>
      {action ? <button onClick={onAction} className="nm-field inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-2 text-xs font-black shadow-sm transition">{action}<ArrowRight size={14}/></button> : null}
    </div>
  );
}

function ListingRail({ title, eyebrow, items, onOpen, onAction, emptyText = 'Henüz öne çıkan ilan yok' }) {
  return (
    <section className="mt-6">
      <SectionHeader eyebrow={eyebrow} title={title} action={items.length ? 'Tümünü gör' : null} onAction={onAction} />
      {items.length ? (
        <div className="flex snap-x gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <div key={item.id} className="min-w-[82vw] snap-start sm:min-w-[300px] sm:max-w-[300px]">
              <ListingCard item={item} onClick={() => onOpen(item)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center dark:border-white/10 dark:bg-white/5">
          <Crown size={28} className="mx-auto text-amber-500" />
          <p className="mt-3 text-sm font-black text-slate-800 dark:text-white">{emptyText}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Öne çıkan ilanlar vitrinde burada listelenir.</p>
        </div>
      )}
    </section>
  );
}

const HERO_IMAGE = 'https://images.unsplash.com/photo-1589394815804-964ed0c4de88?auto=format&fit=crop&w=2000&q=80';

function HeroFeatureBar() {
  const items = [
    { icon: ShieldCheck, label: 'Güvenli Ödeme Sistemi' },
    { icon: UserRound, label: 'Doğrulanmış Satıcılar' },
    { icon: Headphones, label: '7/24 Destek' },
    { icon: Globe2, label: 'Yerel ve Global Topluluk' },
    { icon: Zap, label: 'Kolay ve Hızlı İlan Verme' },
  ];

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-2.5 rounded-2xl bg-white/12 px-3 py-3 text-white ring-1 ring-white/15 backdrop-blur-md dark:bg-black/20">
          <Icon size={18} className="shrink-0 text-brand-teal-light" />
          <span className="text-[11px] font-bold leading-4">{label}</span>
        </div>
      ))}
    </div>
  );
}

function HeroSearchBar({
  query,
  setQuery,
  selectedCategoryLabel,
  openCategorySurface,
  location,
  setLocation,
  loadingListings,
  onSearch,
  locationOptions,
}) {
  return (
    <div className="nm-hero-search mt-6 max-w-5xl">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex min-h-[56px] flex-1 items-center gap-3 px-4 py-3 lg:px-5">
          <Search className="shrink-0 text-brand-teal dark:text-brand-teal-light" size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onSearch();
              }
            }}
            placeholder="Ne arıyorsunuz?"
            aria-label="İlan ara"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div className="nm-hero-search-divider" />

        <button
          type="button"
          onClick={openCategorySurface}
          className="flex min-h-[52px] items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-left text-sm font-bold text-slate-700 lg:min-h-[56px] lg:min-w-[190px] lg:border-t-0 lg:px-5 dark:border-white/10 dark:text-slate-200"
        >
          <span className="truncate">{selectedCategoryLabel || 'Tüm Kategoriler'}</span>
          <ChevronDown size={16} className="shrink-0 opacity-60" />
        </button>

        <div className="nm-hero-search-divider" />

        <div className="flex min-h-[52px] items-center gap-2 border-t border-slate-100 px-4 py-3 lg:min-h-[56px] lg:min-w-[190px] lg:border-t-0 lg:px-5 dark:border-white/10">
          <MapPin size={17} className="shrink-0 text-brand-teal dark:text-brand-teal-light" />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            aria-label="Konum seç"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none dark:text-white"
          >
            {locationOptions.map((x) => (
              <option key={x} value={x}>{x === 'Tumu' ? 'Nouméa, NC' : x}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onSearch}
          disabled={loadingListings}
          className="min-h-[52px] bg-brand-teal px-8 text-sm font-black text-white transition hover:bg-brand-teal-dark disabled:opacity-60 lg:min-h-[56px] lg:rounded-none"
        >
          {loadingListings && query.trim() ? 'Aranıyor...' : 'Ara'}
        </button>
      </div>
    </div>
  );
}

export default function HomePage(){
 const hydrated = useHydrated();
 const [listings,setListings]=useState([]);
 const [featuredListings,setFeaturedListings]=useState([]);
 const [categorySummaryListings,setCategorySummaryListings]=useState([]);
 const [listingsTotal,setListingsTotal]=useState(0);
 const [listingsPage,setListingsPage]=useState(1);
 const [hasMoreListings,setHasMoreListings]=useState(false);
 const [loadingListings,setLoadingListings]=useState(true);
 const [loadingMoreListings,setLoadingMoreListings]=useState(false);
 const [listingsError,setListingsError]=useState('');
 const [user,setUser]=useState(null);
 const [profile,setProfile]=useState(null);
 const [listingEntitlements,setListingEntitlements]=useState(() => normalizeAccountEntitlements({}));
 const [isAdmin,setIsAdmin]=useState(false);
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('Tumu');
 const [selectedCategoryId,setSelectedCategoryId]=useState(null);
 const [location,setLocation]=useState('Tumu');
 const [minPrice,setMinPrice]=useState('');
 const [maxPrice,setMaxPrice]=useState('');
 const [sort,setSort]=useState('newest');
 const [advancedFilters,setAdvancedFilters]=useState({});
 const [selected,setSelected]=useState(null);
 const [showAuth,setShowAuth]=useState(false);
 const [showCreate,setShowCreate]=useState(false);
 const [showAdmin,setShowAdmin]=useState(false);
 const [showPricing,setShowPricing]=useState(false);
 const [pricingListingId,setPricingListingId]=useState('');
 const [showMyListings,setShowMyListings]=useState(false);
 const [showMessages,setShowMessages]=useState(false);
 const [showFavorites,setShowFavorites]=useState(false);
 const [showNotifications,setShowNotifications]=useState(false);
 const [reportListing,setReportListing]=useState(null);
 const [showProfile,setShowProfile]=useState(false);
 const [showMobileCategories,setShowMobileCategories]=useState(false);
 const [notificationCount,setNotificationCount]=useState(0);
 const [activeConversation,setActiveConversation]=useState(null);
 const [theme,setTheme]=useState('light');
 const [favoriteIds, setFavoriteIds] = useState([]);
 const listingsSectionRef = useRef(null);
 const listingRequestRef = useRef(0);
 const urlReadyRef = useRef(false);
 const discoveryBootstrappedRef = useRef(false);
 const openListingBootstrappedRef = useRef(false);
 const supabaseConfigMessage = useMemo(
   () => getPublicSupabaseConfigMessage({ detailed: process.env.NODE_ENV !== 'production' }),
   []
 );

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

 useEffect(()=>{
   if(!showMobileCategories || typeof document === 'undefined') return undefined;
   const previousOverflow = document.body.style.overflow;
   document.body.style.overflow = 'hidden';
   function handleKeyDown(event){
     if(event.key === 'Escape') setShowMobileCategories(false);
   }
   window.addEventListener('keydown', handleKeyDown);
   return () => {
     window.removeEventListener('keydown', handleKeyDown);
     document.body.style.overflow = previousOverflow;
   };
 },[showMobileCategories]);

 useEffect(()=>{
   if(typeof window === 'undefined') return;
   const params = new URLSearchParams(window.location.search);
   if(params.has('q')) setQuery(params.get('q') || '');
   if(params.has('category')) setCategory(params.get('category') || 'Tumu');
   if(params.has('categoryId')) setSelectedCategoryId(params.get('categoryId') || null);
   if(params.has('location')) setLocation(params.get('location') || 'Tumu');
   if(params.has('min')) setMinPrice(params.get('min') || '');
   if(params.has('max')) setMaxPrice(params.get('max') || '');
   if(params.has('sort')) setSort(params.get('sort') || 'newest');
   if(params.has('page')) setListingsPage(Math.max(1, Number(params.get('page') || 1)));
   urlReadyRef.current = true;
 },[]);

 useEffect(()=>{
   if(typeof window === 'undefined' || !urlReadyRef.current) return;
   const params = new URLSearchParams();
   if(query) params.set('q', query);
   if(category && category !== 'Tumu') params.set('category', category);
   if(selectedCategoryId) params.set('categoryId', selectedCategoryId);
   if(location && location !== 'Tumu') params.set('location', location);
   if(minPrice) params.set('min', minPrice);
   if(maxPrice) params.set('max', maxPrice);
   if(sort && sort !== 'newest') params.set('sort', sort);
   if(listingsPage > 1) params.set('page', String(listingsPage));
   const next = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
   window.history.replaceState(null, '', next);
 },[query, category, selectedCategoryId, location, minPrice, maxPrice, sort, listingsPage]);

 function toggleTheme(){
   setTheme((current) => current === 'dark' ? 'light' : 'dark');
 }

 async function refreshProfile(currentUser){
   if(!currentUser?.id){
     setProfile(null);
     setIsAdmin(false);
     setShowAdmin(false);
     setListingEntitlements(normalizeAccountEntitlements({}));
     return;
   }

   try {
     const nextProfile = await withTimeout(getCurrentProfile(currentUser.id), 8000, 'Profil bilgisi zaman aşımına uğradı');
     setProfile(nextProfile);
     setIsAdmin(userIsAdmin(nextProfile));
     setListingEntitlements(await getListingEntitlements(currentUser.id, nextProfile));
   } catch (error) {
     console.warn('refreshProfile:', error);
     setProfile(null);
     setIsAdmin(false);
     setListingEntitlements(normalizeAccountEntitlements({}));
   }
 }

 async function refreshDiscoveryMeta(){
   try {
     const [featured, summaries] = await Promise.all([
       withTimeout(fetchFeaturedListings(8), 9000, 'Öne çıkan ilanlar zaman aşımına uğradı.'),
       withTimeout(fetchApprovedListingSummaries(), 9000, 'Kategori sayıları zaman aşımına uğradı.'),
     ]);
     setFeaturedListings(Array.isArray(featured) ? featured.map(normalizeListing) : []);
     setCategorySummaryListings(Array.isArray(summaries) ? summaries.map(normalizeListing) : []);
   } catch (error) {
     console.warn('refreshDiscoveryMeta:', error);
   }
 }

 async function refreshListings(overrides = {}){
   if (!hasSupabase) {
     setListings([]);
     setFeaturedListings([]);
     setCategorySummaryListings([]);
     setListingsTotal(0);
     setListingsPage(1);
     setHasMoreListings(false);
     setLoadingListings(false);
     setListingsError(supabaseConfigMessage);
     return;
   }

   const requestId = ++listingRequestRef.current;
   const append = overrides.append === true;
   const nextPage = append ? (overrides.page ?? listingsPage + 1) : (overrides.page ?? 1);
   const filters = {
     query,
     categoryId: selectedCategoryId,
     location,
     minPrice,
     maxPrice,
     sort,
     advancedFilters,
     page: nextPage,
     pageSize: DEFAULT_LISTINGS_PAGE_SIZE,
     ...overrides,
   };
   delete filters.append;

   if (append) setLoadingMoreListings(true);
   else setLoadingListings(true);
   setListingsError('');

   try{
     if (showAdmin && isAdmin) {
       const data = await withTimeout(getAdminListings(), 9000, 'Yönetim ilanları zaman aşımına uğradı.');
       if (requestId !== listingRequestRef.current) return;
       setListings(Array.isArray(data) ? data.map(normalizeListing) : []);
       setListingsTotal(Array.isArray(data) ? data.length : 0);
       setListingsPage(1);
       setHasMoreListings(false);
       return;
     }

     const result = await withTimeout(searchListings(filters), 9000, 'İlanlar zaman aşımına uğradı.');
     if (requestId !== listingRequestRef.current) return;

     const normalized = Array.isArray(result?.data) ? result.data.map(normalizeListing) : [];
     setListings((current) => append ? [...current, ...normalized] : normalized);
     setListingsTotal(Number(result?.total || normalized.length || 0));
     setListingsPage(Number(result?.page || nextPage));
     setHasMoreListings(Boolean(result?.hasMore));

     if (!append) {
       await refreshDiscoveryMeta();
     }
   }catch(error){
     console.warn(error);
     if (requestId === listingRequestRef.current) {
       if (!append) setListings([]);
       setListingsError(error.message || 'İlanlar yüklenirken bir sorun oluştu.');
     }
   }finally{
     if (requestId === listingRequestRef.current) {
       if (append) setLoadingMoreListings(false);
       else setLoadingListings(false);
     }
   }
 }

 async function loadMoreListings(){
   if (!hasMoreListings || loadingListings || loadingMoreListings) return;
   await refreshListings({ page: listingsPage + 1, append: true });
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
   if (!hasSupabase) return undefined;

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

 useEffect(()=>{
   if (!hasSupabase) {
     setLoadingListings(false);
     setListingsError(supabaseConfigMessage);
     return undefined;
   }
   if (!urlReadyRef.current) return undefined;

   if (!discoveryBootstrappedRef.current) {
     discoveryBootstrappedRef.current = true;
     const params = new URLSearchParams(window.location.search);
     refreshListings({
       page: Math.max(1, Number(params.get('page') || listingsPage || 1)),
       query: params.get('q') || '',
       categoryId: params.get('categoryId') || null,
       location: params.get('location') || 'Tumu',
       minPrice: params.get('min') || '',
       maxPrice: params.get('max') || '',
       sort: params.get('sort') || 'newest',
     });
     return undefined;
   }

   setListingsPage(1);
   const timer = setTimeout(() => {
     refreshListings({ page: 1 });
   }, 350);
   return () => clearTimeout(timer);
 },[showAdmin, isAdmin, selectedCategoryId, location, minPrice, maxPrice, sort, advancedFilters]);

 useEffect(()=>{
   if(!loadingListings) return undefined;
   const timer = setTimeout(() => setLoadingListings(false), 20000);
   return () => clearTimeout(timer);
 },[loadingListings]);

 useEffect(() => {
   if (!user?.id) {
     setFavoriteIds([]);
     return undefined;
   }
   let mounted = true;
   getFavoriteIds(user.id)
     .then((ids) => { if (mounted) setFavoriteIds(Array.isArray(ids) ? ids : []); })
     .catch(() => { if (mounted) setFavoriteIds([]); });
   return () => { mounted = false; };
 }, [user?.id]);

 useEffect(() => {
   if (typeof window === 'undefined' || openListingBootstrappedRef.current) return undefined;
   const params = new URLSearchParams(window.location.search);
   const openListingId = params.get('openListing');
   if (!openListingId) return undefined;

   openListingBootstrappedRef.current = true;

   async function openListingFromPermalink() {
     let listing = listings.find((item) => String(item.id) === String(openListingId));
     if (!listing) {
       try {
         const response = await fetch(`/api/listings/${openListingId}`);
         const payload = await response.json().catch(() => ({}));
         if (response.ok && payload.data) listing = normalizeListing(payload.data);
       } catch (error) {
         console.warn('openListing fetch failed:', error);
       }
     }
     if (!listing) return;

     setSelected(listing);
     params.delete('openListing');
     const nextQuery = params.toString();
     window.history.replaceState(null, '', nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname);
   }

   openListingFromPermalink();
   return undefined;
 }, [listings]);

 const approved=listings.filter(x=>isPublicListingStatus(x.status));
 const pending=listings.filter(x=>x.status==='pending');
 const categoryCounts = useMemo(
   () => (hydrated ? calculateCategoryCounts(categorySummaryListings) : {}),
   [categorySummaryListings, hydrated]
 );
 const displayUser = hydrated ? user : null;
 const displayProfile = hydrated ? profile : null;
 const displayIsAdmin = hydrated ? isAdmin : false;

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
 const hasActiveDiscoveryFilters = Boolean(
   selectedCategoryId ||
   query ||
   (location && location !== 'Tumu') ||
   minPrice ||
   maxPrice ||
   (sort && sort !== 'newest') ||
   Object.values(advancedFilters || {}).some((value) => value !== undefined && value !== null && String(value).trim() !== '')
 );
 const emptyResultsTitle = query.trim()
   ? 'Aramanızla eşleşen ilan bulunamadı'
   : selectedCategoryId
     ? 'Bu kategoride ilan bulunamadı'
     : (location && location !== 'Tumu')
       ? 'Bu konumda ilan bulunamadı'
       : hasActiveDiscoveryFilters
         ? 'Sonuç bulunamadı'
         : 'Henüz yayınlanmış ilan yok';
 const emptyResultsText = hasActiveDiscoveryFilters
   ? 'Filtreleri değiştirerek tekrar deneyin.'
   : 'İlk ilanı sen ver.';
 const listingsCountLabel = loadingListings
   ? (query.trim() ? 'Aranıyor...' : 'İlanlar yükleniyor...')
   : `${listingsTotal} ilan bulundu${selectedCategoryLabel ? ` · ${selectedCategoryLabel}` : ''}`;

 function clearAllDiscoveryFilters() {
   setQuery('');
   setCategory('Tumu');
   setSelectedCategoryId(null);
   setAdvancedFilters({});
   setLocation('Tumu');
   setMinPrice('');
   setMaxPrice('');
   setSort('newest');
   setListingsPage(1);
   refreshListings({ query: '', categoryId: null, location: 'Tumu', minPrice: '', maxPrice: '', sort: 'newest', advancedFilters: {}, page: 1 });
 }

 function removeDiscoveryFilter(key) {
   const overrides = { page: 1 };
   switch (key) {
     case 'query':
       setQuery('');
       overrides.query = '';
       break;
     case 'category':
       setSelectedCategoryId(null);
       setCategory('Tumu');
       overrides.categoryId = null;
       break;
     case 'location':
       setLocation('Tumu');
       overrides.location = 'Tumu';
       break;
     case 'minPrice':
       setMinPrice('');
       overrides.minPrice = '';
       break;
     case 'maxPrice':
       setMaxPrice('');
       overrides.maxPrice = '';
       break;
     case 'sort':
       setSort('newest');
       overrides.sort = 'newest';
       break;
     default:
       return;
   }
   setListingsPage(1);
   refreshListings(overrides);
 }

 function handleHeroCategorySelect(categoryId, label){
   setSelectedCategoryId(categoryId);
   setAdvancedFilters({});
   setCategory(label);
   setQuery('');
   setListingsPage(1);
   scrollToListings();
 }

 const categoryShowcases = useMemo(() => [
   { label: 'Otomobil', icon: CarFront, tone: 'from-cyan-500 to-blue-600', categoryId: 'cars' },
   { label: 'Emlak', icon: Building2, tone: 'from-emerald-500 to-teal-600', categoryId: 'real-estate' },
   { label: 'Elektronik', icon: Smartphone, tone: 'from-violet-500 to-fuchsia-600', categoryId: 'technology' },
   { label: 'Mobilya ve Ev', icon: Sofa, tone: 'from-amber-500 to-rose-500', categoryId: 'furniture-home' },
 ], []);

 function ensureActiveAccount(actionLabel = 'Bu işlem') {
   if (isUserSuspended(profile)) {
     alert(SUSPENSION_BLOCK_MESSAGE);
     return false;
   }
   return true;
 }

 async function handleCreate(payload){
   if(!user){
     setShowCreate(false);
     setShowAuth(true);
     alert('İlan vermek için önce giriş yapmalısın.');
     return;
   }
   if (!ensureActiveAccount('İlan verme')) return;
   try{
     if(listingEntitlements.requiresStandardListingPayment){
       setShowCreate(false);
       setShowPricing(true);
       alert('Ücretsiz ilan hakkın doldu. Devam etmek için ödeme yap veya Premium Satıcı ol.');
       return;
     }
     await createListing({...payload,user_id:user.id, profile});
     setShowCreate(false);
     alert('İlanınız incelenmek üzere gönderildi. Moderasyon onayından sonra yayına alınacak.');
     await refreshListings();
     await refreshProfile(user);
   }catch(error){
     console.warn(error);
     alert(error.message || 'İlan kaydedilemedi. Veritabanı kolonlarını ve RLS yetkilerini kontrol et.');
   }
 }

 async function approve(id){try{await approveListing(id); await refreshListings()}catch(e){alert(e.message || 'Onaylama başarısız. Yönetim yetkisi veya RLS ayarlarını kontrol et.'); throw e}}
 async function reject(id,note=''){try{await rejectListing(id,note); await refreshListings()}catch(e){alert(e.message || 'Reddetme başarısız. Yönetim yetkisi veya RLS ayarlarını kontrol et.'); throw e}}
 async function del(id){try{await deleteListing(id); await refreshListings()}catch(e){alert(e.message || 'Silme başarısız. Yönetim yetkisi veya RLS ayarlarını kontrol et.'); throw e}}
 async function feature(id){try{const item=listings.find(x=>x.id===id); await toggleFeaturedListing(id,!item?.isFeatured); await refreshListings()}catch(e){alert(e.message || 'Öne çıkarma başarısız. Yönetim yetkisi veya RLS ayarlarını kontrol et.'); throw e}}

 
 function scrollToListings(){
   setTimeout(() => listingsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
 }

 function openCreateListing() {
   if (!user) {
     setShowAuth(true);
     return;
   }
   if (!ensureActiveAccount('İlan verme')) return;
   setShowCreate(true);
 }

 function openCategorySurface(){
   if(typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1024px)').matches){
     document.querySelector('[data-marketplace-sidebar="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
     return;
   }
   setShowMobileCategories(true);
 }

 function handleSidebarCategory(node){
   if(!node){
     setSelectedCategoryId(null);
     setAdvancedFilters({});
     setCategory('Tumu');
     setListingsPage(1);
     scrollToListings();
     return;
   }
   if(node.children?.length) return;
   const found = findCategoryNode(node.id);
   const label = found ? found.path.map(x => x.label).join(' > ') : node.label;
   setSelectedCategoryId(node.id);
   setAdvancedFilters({});
   setCategory(label);
   setListingsPage(1);
   scrollToListings();
 }

 function openProfile(){
   if(!user?.id){
     setShowAuth(true);
     alert('Profilini düzenlemek için önce giriş yapmalısın.');
     return;
   }
   setShowProfile(true);
 }

 async function handleProfileSaved(saved){
   setProfile(saved || profile);
   if(user?.id) await refreshProfile(user);
 }

 function handleReportListing(listing){
   if(!user?.id){
     setShowAuth(true);
     alert('Şikayet göndermek için önce giriş yapmalısın.');
     return;
   }
   if (!ensureActiveAccount('Şikayet gönderme')) return;
   setReportListing(listing);
 }

 async function startChatForListing(listing){
   if(!user){
     setShowAuth(true);
     alert('Satıcıya mesaj göndermek için giriş yap.');
     return;
   }
   if (!ensureActiveAccount('Mesaj gönderme')) return;

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

 async function handleNotificationAction(notification) {
   setShowNotifications(false);
   await refreshNotifications();

   if (notification.actionTarget === 'my_listings') {
     setShowMyListings(true);
     return;
   }

   if (notification.actionTarget === 'messages') {
     if (notification.conversationId && user?.id) {
       try {
         const conversations = await getMyConversations(user.id);
         const conversation = conversations.find((item) => item.id === notification.conversationId);
         if (conversation) {
           setActiveConversation(conversation);
           return;
         }
       } catch (error) {
         console.warn('handleNotificationAction messages:', error);
       }
     }
     setShowMessages(true);
     return;
   }

   if (notification.actionTarget === 'listing' && notification.listingId) {
     const localListing = listings.find((item) => String(item.id) === String(notification.listingId));
     if (localListing) {
       setSelected(localListing);
       return;
     }
     if (typeof window !== 'undefined') {
       window.location.href = `/ilan/${notification.listingId}`;
     }
     return;
   }

   if (notification.actionTarget === 'payment_pending' && typeof window !== 'undefined') {
     window.location.href = '/payment-pending';
   }
 }

 async function handleToggleFavorite(listing) {
   if (!listing?.id) return;
   if (!user) {
     setShowAuth(true);
     return;
   }
   if (!ensureActiveAccount('Favoriler')) return;
   try {
     const isFavorite = favoriteIds.includes(listing.id);
     await toggleFavorite(user.id, listing.id, isFavorite);
     setFavoriteIds((current) => (
       isFavorite ? current.filter((id) => id !== listing.id) : [...current, listing.id]
     ));
   } catch (error) {
     console.warn('handleToggleFavorite:', error);
   }
 }

 return <div className="min-h-screen [overflow-x:clip] bg-[var(--background)] pb-28 text-slate-900 transition-colors dark:text-white md:pb-0">
  {!hasSupabase && (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      {supabaseConfigMessage}
    </div>
  )}
  {displayUser && isUserSuspended(displayProfile) && (
    <div className="border-b border-rose-300 bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
      {SUSPENSION_BLOCK_MESSAGE}
    </div>
  )}
  <Header
    user={displayUser}
    isAdmin={displayIsAdmin}
    onAuth={() => setShowAuth(true)}
    onLogout={async()=>{
      if (supabase) await supabase.auth.signOut();
      setUser(null); setProfile(null); setIsAdmin(false); setShowAdmin(false); setNotificationCount(0);
    }}
    onCreate={()=>{ if(!user){ setShowAuth(true); return; } if (!ensureActiveAccount('İlan verme')) return; setShowCreate(true); }}
    onPricing={()=>setShowPricing(true)}
    onAdmin={()=>{ if(!isAdmin){ alert('Yönetim paneline erişim yetkin yok.'); return; } setShowAdmin(true); }}
    onMyListings={()=>setShowMyListings(true)}
    onMessages={()=> user ? setShowMessages(true) : setShowAuth(true)}
    onFavorites={()=> user ? setShowFavorites(true) : setShowAuth(true)}
    onNotifications={()=> user ? setShowNotifications(true) : setShowAuth(true)}
    onProfile={openProfile}
    notificationCount={hydrated ? notificationCount : 0}
    searchQuery={query}
    onSearchQueryChange={setQuery}
    onSearchSubmit={() => { setListingsPage(1); refreshListings({ page: 1 }); scrollToListings(); }}
    theme={hydrated ? theme : 'light'}
    onToggleTheme={toggleTheme}
  />

  <main className="relative mx-auto grid w-full max-w-[1560px] items-start gap-5 px-3 py-3 sm:px-4 md:px-6 md:py-5 lg:grid-cols-[300px_minmax(0,1fr)]">
    <MarketplaceSidebar selectedCategoryId={selectedCategoryId} onSelectCategory={handleSidebarCategory} categoryCounts={categoryCounts} onPremiumClick={() => setShowPricing(true)} onHomeClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
    <div className="min-w-0 flex-1">
      <section className="relative min-h-[420px] overflow-hidden rounded-shell border border-slate-200/60 shadow-card dark:border-white/10 sm:min-h-[480px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[var(--hero-overlay)]" aria-hidden="true" />
        <div className="relative flex min-h-[420px] flex-col justify-end p-5 sm:min-h-[480px] sm:p-8 lg:p-10">
          <h1 className="nm-hero-title max-w-3xl text-3xl font-black leading-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            Nouméa&apos;da Yeni Fırsatlar Sizi Bekliyor
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/90 sm:text-base sm:leading-7">
            Güvenilir topluluk pazaryeri NouMarket&apos;te binlerce premium ilanı keşfedin.
          </p>
          <HeroSearchBar
            query={query}
            setQuery={setQuery}
            selectedCategoryLabel={selectedCategoryLabel}
            openCategorySurface={openCategorySurface}
            location={location}
            setLocation={setLocation}
            loadingListings={loadingListings}
            onSearch={() => { setListingsPage(1); refreshListings({ page: 1 }); scrollToListings(); }}
            locationOptions={LOCATION_OPTIONS}
          />
          <HeroFeatureBar />
        </div>
      </section>
      <section className="mt-6">
        <SectionHeader eyebrow="Keşfet" title="Popüler kategoriler" action="Tüm kategoriler" onAction={openCategorySurface} />
        <div className="-mx-1 flex snap-x gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {categoryShowcases.map(({ label, icon: Icon, tone, categoryId }) => (
            <Fragment key={label}>
              <button type="button" onClick={() => handleHeroCategorySelect(categoryId, label)} className="flex min-w-[84px] shrink-0 snap-start flex-col items-center gap-2 sm:hidden">
                <span className="grid h-[68px] w-[68px] place-items-center rounded-2xl bg-white text-brand-teal shadow-card ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-white/10"><Icon size={24}/></span>
                <span className="max-w-[88px] truncate text-center text-xs font-bold text-slate-700 dark:text-slate-200">{label}</span>
              </button>
              <button type="button" onClick={() => handleHeroCategorySelect(categoryId, label)} className={`group hidden min-w-0 overflow-hidden rounded-shell bg-gradient-to-br p-5 text-left text-white shadow-card transition hover:-translate-y-0.5 sm:block ${tone}`}>
                <Icon size={28}/>
                <div className="mt-4 text-xl font-black sm:text-2xl">{label}</div>
                <div className="mt-2 text-sm font-semibold text-white/82">{categoryCounts[categoryId] || 0} ilan</div>
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide">Keşfet <ArrowRight size={14}/></div>
              </button>
            </Fragment>
          ))}
        </div>
      </section>
      <ListingRail title="Premium İlanlar" eyebrow="Vitrin" items={featuredListings} onOpen={setSelected} onAction={scrollToListings} />
      <div ref={listingsSectionRef} className="scroll-mt-24" />
      <SearchFilters hideQueryField query={query} setQuery={setQuery} category={category} setCategory={setCategory} location={location} setLocation={setLocation} minPrice={minPrice} setMinPrice={setMinPrice} maxPrice={maxPrice} setMaxPrice={setMaxPrice} sort={sort} setSort={setSort} selectedCategory={selectedCategory} advancedFilters={advancedFilters} setAdvancedFilters={setAdvancedFilters} isLoading={loadingListings} onSearch={() => { setListingsPage(1); refreshListings({ page: 1 }); scrollToListings(); }} onClear={clearAllDiscoveryFilters} />
      <ActiveFilterChips query={query} categoryLabel={selectedCategoryLabel} location={location} minPrice={minPrice} maxPrice={maxPrice} sort={sort} onRemove={removeDiscoveryFilter} onClearAll={clearAllDiscoveryFilters} />
      {selectedCategory && <section className="mt-5 rounded-[28px] border border-cyan-200/70 bg-cyan-50/80 px-4 py-4 shadow-sm dark:border-cyan-300/20 dark:bg-cyan-400/10"><div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><div className="text-[11px] font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Seçili kategori</div><div className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">{selectedPath.map((item) => item.label).join(' > ')}</div></div><button onClick={() => handleSidebarCategory(null)} className="nm-field shrink-0 rounded-full border px-4 py-2 text-xs font-black">Kategoriyi temizle</button></div></section>}
      <section className="mt-5 pb-28 md:pb-5"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-teal dark:text-brand-teal-light">Keşfet</div><h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Son ilanlar</h2><p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{listingsCountLabel}</p></div><div className="flex gap-2">{displayIsAdmin && <button onClick={()=>setShowAdmin(true)} className="rounded-full bg-amber-50 px-4 py-2 text-xs font-black text-amber-700 ring-1 ring-amber-200">{pending.length} onay bekliyor</button>}</div></div>{loadingListings ? <div><p className="mb-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{query.trim() ? 'Aranıyor...' : 'İlanlar yükleniyor...'}</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[360px] animate-pulse rounded-[28px] bg-[var(--surface)] ring-1 ring-[var(--field-border)]" />)}</div></div> : listingsError ? <div className="nm-panel rounded-[30px] border p-8 text-center shadow-sm"><div className="text-lg font-black text-slate-950 dark:text-white">İlanlar yüklenirken bir sorun oluştu</div><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{listingsError}</p><button onClick={() => refreshListings({ page: 1 })} className="mt-5 min-h-[48px] rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white dark:bg-cyan-600">Tekrar dene</button></div> : listingsTotal === 0 ? <div className="nm-panel rounded-[30px] border p-8 text-center shadow-sm"><div className="text-lg font-black text-slate-950 dark:text-white">{emptyResultsTitle}</div><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{emptyResultsText}</p><button onClick={() => { if(!hasActiveDiscoveryFilters){ if(!user){ setShowAuth(true); return; } if (!ensureActiveAccount('İlan verme')) return; setShowCreate(true); return; } clearAllDiscoveryFilters(); }} className="mt-5 min-h-[48px] rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white dark:bg-cyan-600">{hasActiveDiscoveryFilters ? 'Tüm filtreleri temizle' : 'İlan Ver'}</button></div> : <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{approved.map(item=><ListingCard key={item.id} item={item} onClick={()=>setSelected(item)} onFavorite={handleToggleFavorite} isFavorite={favoriteIds.includes(item.id)} />)}</div>{hasMoreListings ? <div className="mt-5 flex justify-center"><button type="button" onClick={loadMoreListings} disabled={loadingMoreListings} className="min-h-[48px] rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-600 dark:hover:bg-cyan-500">{loadingMoreListings ? 'Yükleniyor...' : 'Daha fazla göster'}</button></div> : null}</>}</section>
    </div>
  </main>

  {showMobileCategories && (
    <div className="fixed inset-0 z-[95] lg:hidden">
      <button type="button" aria-label="Kategorileri kapat" onClick={()=>setShowMobileCategories(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <div onClick={(event) => event.stopPropagation()} className="absolute inset-y-0 left-0 w-[88vw] max-w-sm overflow-hidden rounded-r-[30px] bg-[var(--surface)] p-3 shadow-2xl">
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <h3 className="text-lg font-black text-[var(--foreground)]">Kategoriler</h3>
            <p className="text-xs font-semibold text-[var(--muted)]">Kategori seç, sonuçlar güncellensin.</p>
          </div>
          <button type="button" onClick={()=>setShowMobileCategories(false)} className="grid h-11 w-11 place-items-center rounded-full bg-[var(--surface-soft)] text-[var(--foreground)] ring-1 ring-[var(--field-border)]"><X size={20}/></button>
        </div>
        <MarketplaceSidebar
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(node) => {
            handleSidebarCategory(node);
            if (!node || !node.children?.length) setShowMobileCategories(false);
          }}
          categoryCounts={categoryCounts}
          onPremiumClick={() => { setShowMobileCategories(false); setShowPricing(true); }}
          onHomeClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="block max-h-[calc(100dvh-84px)] w-full overflow-y-auto rounded-3xl border border-[var(--field-border)] bg-[var(--surface-glass)] p-3 shadow-none"
        />
      </div>
    </div>
  )}

  <BottomNav
    user={displayUser}
    onCreate={()=>{ if(!user){ setShowAuth(true); return; } if (!ensureActiveAccount('İlan verme')) return; setShowCreate(true); }}
    onMessages={()=> user ? setShowMessages(true) : setShowAuth(true)}
    onMyListings={()=> user ? setShowMyListings(true) : setShowAuth(true)}
    onProfile={openProfile}
    onCategories={openCategorySurface}
    onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
  />

  {showAuth&&<AuthModal onClose={async()=>{setShowAuth(false); if(!supabase){ setUser(null); await refreshProfile(null); return; } const {data}=await supabase.auth.getUser(); setUser(data.user ?? null); await refreshProfile(data.user ?? null)}}/>}
  {showCreate&&<ListingForm user={user} profile={profile} listingEntitlements={listingEntitlements} onOpenPricing={()=>setShowPricing(true)} onClose={()=>setShowCreate(false)} onCreate={handleCreate}/>}  
  {showAdmin&&isAdmin&&<AdminPanel listings={listings} onApprove={approve} onReject={reject} onDelete={del} onFeature={feature} onClose={()=>setShowAdmin(false)}/>}  
  {showPricing&&<PricingModal listingId={pricingListingId} profile={profile} entitlements={listingEntitlements} onClose={()=>{ setShowPricing(false); setPricingListingId(''); }} />}  
  {showMyListings&&(<MyListingsModal user={user} profile={profile} entitlements={listingEntitlements} onClose={()=>setShowMyListings(false)} onOpenCreate={()=>{ setShowMyListings(false); if (!ensureActiveAccount('İlan verme')) return; setShowCreate(true); }} onOpenPricing={(listingId)=>{ setPricingListingId(listingId); setShowMyListings(false); setShowPricing(true); }} />)}
  {showMessages&&(<MessagesModal user={user} onClose={()=>setShowMessages(false)} onOpenConversation={(conversation)=>{ setShowMessages(false); setActiveConversation(conversation); }} />)}
  {showFavorites&&(<FavoritesModal user={user} onClose={()=>setShowFavorites(false)} onOpenListing={(listing)=>{ setShowFavorites(false); setSelected(listing); }} />)}
  {showNotifications&&(<NotificationsModal user={user} onClose={async()=>{ setShowNotifications(false); await refreshNotifications(); }} onUnreadChange={() => refreshNotifications()} onAction={handleNotificationAction} />)}
  {activeConversation&&(<ChatModal user={user} conversation={activeConversation} onClose={()=>setActiveConversation(null)} />)}
  {selected&&(<ListingDetailModal selected={selected} user={user} onClose={()=>setSelected(null)} onStartChat={()=>startChatForListing(selected)} onFavorite={handleToggleFavorite} onReport={handleReportListing} />)}
  {reportListing&&(<ReportListingModal user={user} listing={reportListing} onClose={()=>setReportListing(null)} />)}
  {showProfile&&user&&(<ProfileModal user={user} profile={profile} onClose={()=>setShowProfile(false)} onSaved={handleProfileSaved} />)}
 </div>;
}
