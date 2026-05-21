'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, Eye, Crown, BarChart3, Globe2, Plus, CreditCard, SlidersHorizontal } from 'lucide-react';
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
import { getCurrentProfile, userIsAdmin } from '@/lib/profiles';
import { getApprovedListings, getAdminListings, createListing, approveListing, rejectListing, deleteListing, toggleFeaturedListing, normalizeListing } from '@/lib/listings';

export default function HomePage(){
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
       : await searchListings({
           query,
           category,
           location,
           minPrice,
           maxPrice,
           sort,
         });
     setListings(data.map(normalizeListing));
   }catch(error){
     console.error(error);
     setListings(demoListings);
   }finally{
     setLoadingListings(false);
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
     console.error(error);
     setNotificationCount(0);
     return;
   }

   setNotificationCount(count || 0);
 }

 useEffect(()=>{
   supabase.auth.getUser().then(async ({data})=>{
     const currentUser = data.user ?? null;
     setUser(currentUser);
     await refreshProfile(currentUser);
     await refreshNotifications(currentUser);
   });

   const {data:listener}=supabase.auth.onAuthStateChange(async (_event,session)=>{
     const currentUser = session?.user ?? null;
     setUser(currentUser);
     await refreshProfile(currentUser);
     await refreshNotifications(currentUser);
   });

   return ()=>listener.subscription.unsubscribe();
 },[]);

 useEffect(()=>{refreshListings()},[showAdmin,isAdmin]);

 const approved=listings.filter(x=>x.status==='approved');
 const pending=listings.filter(x=>x.status==='pending');
 const locations=['Tümü',...Array.from(new Set(approved.map(x=>x.location)))];

 const stats=useMemo(()=>{
   const totalViews=approved.reduce((a,x)=>a+(x.views||0),0);
   const featured=approved.filter(x=>x.isFeatured).length;
   return {totalViews,featured,estimatedRevenue:featured*1500};
 },[approved]);

 const filtered=useMemo(()=>approved,[approved]);

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
     console.error(error);
     alert(error.message || 'İlan kaydedilemedi.');
   }
 }

 async function approve(id){try{await approveListing(id); await refreshListings()}catch(e){alert(e.message || 'Onaylama başarısız. Admin yetkisi/RLS kontrol et.')}}
 async function reject(id){try{await rejectListing(id); await refreshListings()}catch(e){alert(e.message || 'Reddetme başarısız. Admin yetkisi/RLS kontrol et.')}}
 async function del(id){try{await deleteListing(id); await refreshListings()}catch(e){alert(e.message || 'Silme başarısız. Admin yetkisi/RLS kontrol et.')}}
 async function feature(id){try{const item=listings.find(x=>x.id===id); await toggleFeaturedListing(id,!item?.isFeatured); await refreshListings()}catch(e){alert(e.message || 'Öne çıkarma başarısız. Admin yetkisi/RLS kontrol et.')}}

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
     setActiveConversation(conversation);
   }catch(error){
     alert(error.message || 'Sohbet başlatılamadı.');
   }
 }

 return <div className="min-h-screen bg-slate-50 text-slate-900">
  <Header
    user={user}
    isAdmin={isAdmin}
    onAuth={()=>setShowAuth(true)}
    onLogout={async()=>{
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setShowAdmin(false);
      setNotificationCount(0);
    }}
    onCreate={()=>setShowCreate(true)}
    onPricing={()=>setShowPricing(true)}
    onAdmin={()=>{
      if(!isAdmin){
        alert('Admin yetkin yok.');
        return;
      }
      setShowAdmin(true);
    }}
    onMyListings={()=>setShowMyListings(true)}
    onMessages={()=>setShowMessages(true)}
    onFavorites={()=>setShowFavorites(true)}
    onNotifications={()=>setShowNotifications(true)}
    notificationCount={notificationCount}
  />
  <main>
   <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 md:pt-14">
    <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
     <div>
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 shadow-sm"><ShieldCheck size={16}/> Admin onaylı lokal ilan platformu</div>
      <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Nouméa’da al, sat, kirala, iş bul.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Araç, ev, tekne ekipmanı, elektronik ve hizmet ilanlarını tek yerde toplayan modern yerel pazar yeri.</p>
      <div className="mt-7 rounded-3xl bg-white p-3 shadow-lg ring-1 ring-slate-200"><div className="grid gap-3 md:grid-cols-[1fr_auto]"><div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3"><Search className="text-slate-500" size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Hilux, kiralık ev, iPhone, tekne..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"/></div><button onClick={refreshListings} className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white">Ara</button></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
       <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><div className="flex items-center gap-2 text-sm font-bold text-slate-500"><Eye size={16}/> Görüntülenme</div><div className="mt-2 text-2xl font-black">{stats.totalViews}</div></div>
       <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><div className="flex items-center gap-2 text-sm font-bold text-slate-500"><Crown size={16}/> Premium ilan</div><div className="mt-2 text-2xl font-black">{stats.featured}</div></div>
       <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"><div className="flex items-center gap-2 text-sm font-bold text-slate-500"><BarChart3 size={16}/> Tahmini gelir</div><div className="mt-2 text-2xl font-black">{formatXpf(stats.estimatedRevenue)}</div></div>
      </div>
     </div>
     <div className="relative hidden lg:block"><div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-200"><img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=80" className="h-[430px] w-full object-cover" alt="New Caledonia landscape"/><div className="absolute bottom-6 left-6 right-6 rounded-3xl bg-white/90 p-5 shadow-xl backdrop-blur"><div className="text-sm font-semibold text-slate-500">Platform özeti</div><div className="mt-1 text-2xl font-black">{approved.length} aktif ilan</div><div className="mt-2 text-sm text-slate-600">{pending.length} ilan onay bekliyor</div></div></div></div>
    </div>
   </section>
   <section className="mx-auto max-w-7xl px-4 py-4">
    <div className="mb-4 rounded-3xl bg-slate-900 p-6 text-white shadow-sm"><div className="flex items-center gap-2 text-sm font-bold text-slate-300"><Globe2 size={17}/> Gerçek MVP mimarisi</div><h2 className="mt-2 text-2xl font-black">Supabase + Vercel ile canlıya çıkmaya hazır yapı</h2></div>
    <div className="grid gap-4 md:grid-cols-3"><div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-500"><Plus size={17}/> Ücretsiz ilan</div><div className="text-2xl font-black">0 XPF</div></div><div className="rounded-3xl bg-amber-50 p-5 shadow-sm ring-1 ring-amber-200"><div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800"><Crown size={17}/> Öne çıkan ilan</div><div className="text-2xl font-black">1.500 XPF</div></div><div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-500"><CreditCard size={17}/> Mağaza üyeliği</div><div className="text-2xl font-black">9.900 XPF / ay</div></div></div>
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
    onSearch={refreshListings}
    onClear={()=>{
      setQuery('');
      setCategory('Tümü');
      setLocation('Tümü');
      setMinPrice('');
      setMaxPrice('');
      setSort('newest');
      setTimeout(()=>refreshListings(),0);
    }}
   />
   <section className="mx-auto max-w-7xl px-4 py-8"><div className="mb-5"><h2 className="text-2xl font-black">Son ilanlar</h2><p className="mt-1 text-sm text-slate-500">{loadingListings?'İlanlar yükleniyor...':`${filtered.length} ilan gösteriliyor`}</p></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(item=><ListingCard key={item.id} item={item} onClick={()=>setSelected(item)}/>)}</div></section>
  </main>
  {showAuth&&<AuthModal onClose={async()=>{setShowAuth(false); const {data}=await supabase.auth.getUser(); setUser(data.user ?? null); await refreshProfile(data.user ?? null)}}/>}
  {showCreate&&<ListingForm onClose={()=>setShowCreate(false)} onCreate={handleCreate}/>}  
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
  {showNotifications&&(
    <NotificationsModal
      user={user}
      onClose={async()=>{
        setShowNotifications(false);
        await refreshNotifications();
      }}
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
