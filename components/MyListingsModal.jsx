'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, RefreshCw, Trash2, Pencil, Crown, MapPin, Eye, Heart, MessageCircle, PauseCircle, PlayCircle, CheckCircle2, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMyListings, deleteMyListing, updateMyListingStatus } from '@/lib/myListings';
import EditListingModal from '@/components/EditListingModal';
import { listPremiumPlans, formatPlanPrice } from '@/lib/premiumPlans';

function statusLabel(status) {
  if (status === 'approved') return 'Yayında';
  if (status === 'pending') return 'Onay bekliyor';
  if (status === 'rejected') return 'Reddedildi';
  if (status === 'passive') return 'Pasif';
  if (status === 'sold') return 'Satıldı';
  return status || 'Bilinmiyor';
}

function statusClass(status) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status === 'pending') return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (status === 'rejected') return 'bg-red-50 text-red-700 ring-red-200';
  if (status === 'passive') return 'bg-slate-100 text-slate-700 ring-slate-200';
  if (status === 'sold') return 'bg-blue-50 text-blue-700 ring-blue-200';
  return 'bg-slate-50 text-slate-700 ring-slate-200';
}

function getListingImage(item) {
  if (item?.image_url) return item.image_url;
  if (Array.isArray(item?.listing_images) && item.listing_images.length > 0) return item.listing_images[0]?.image_url || '';
  return '';
}

function formatPrice(item) {
  if (item?.price === null || item?.price === undefined || item?.price === '') return 'Görüşülür';
  const amount = Number(item.price);
  if (Number.isNaN(amount)) return 'Görüşülür';
  return `${amount.toLocaleString('fr-FR')} ${item.currency || 'XPF'}`;
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white p-3 text-slate-900 shadow-sm ring-1 ring-slate-200"><Icon size={18} /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl font-black text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function MyListingsModal({ user, onClose }) {
  const mountedRef = useRef(false);
  const [currentUser, setCurrentUser] = useState(user || null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [errorText, setErrorText] = useState('');
  const [premiumTarget, setPremiumTarget] = useState(null);
  const premiumPlans = listPremiumPlans();

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.status === filter);
  }, [items, filter]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.status === 'approved').length,
    pending: items.filter((item) => item.status === 'pending').length,
    views: items.reduce((sum, item) => sum + Number(item.view_count || item.views || 0), 0),
    favorites: items.reduce((sum, item) => sum + Number(item.favorite_count || 0), 0),
    messages: items.reduce((sum, item) => sum + Number(item.message_count || 0), 0),
  }), [items]);

  async function resolveUser() {
    if (user?.id) return user;
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) return data.session.user;
      const result = await supabase.auth.getUser();
      return result?.data?.user || null;
    } catch (error) {
      console.error('resolveUser error:', error);
      return null;
    }
  }

  async function loadListings() {
    setLoading(true);
    setErrorText('');
    try {
      const activeUser = await resolveUser();
      if (!mountedRef.current) return;
      setCurrentUser(activeUser || null);
      if (!activeUser?.id) {
        setItems([]);
        setErrorText('Oturum bulunamadı. Çıkış yapıp tekrar giriş yap.');
        return;
      }
      const rows = await getMyListings();
      if (!mountedRef.current) return;
      setItems(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error('MyListingsModal loadListings error:', error);
      if (!mountedRef.current) return;
      setItems([]);
      setErrorText(error?.message || 'İlanların yüklenemedi.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    loadListings();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runListingAction(item, action, confirmText) {
    if (confirmText && !confirm(confirmText)) return;
    try {
      setBusyId(item.id);
      await updateMyListingStatus(item.id, action);
      await loadListings();
    } catch (error) {
      alert(error.message || 'İşlem tamamlanamadı.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu ilanı kalıcı olarak silmek istediğine emin misin?')) return;
    try {
      setBusyId(id);
      await deleteMyListing(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      alert(error.message || 'İlan silinemedi.');
    } finally {
      setBusyId(null);
    }
  }

  async function handlePremium(item, planId = 'premium_7') {
    const activeUser = currentUser || user;
    if (!activeUser?.id) {
      alert('Premium satın almak için giriş yapmalısın.');
      return;
    }
    try {
      setPayingId(`${item.id}:${planId}`);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: item.id, userId: activeUser.id, planId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Checkout başlatılamadı.');
      window.location.href = data.url;
    } catch (error) {
      alert(error.message || 'Premium ödeme başlatılamadı.');
    } finally {
      setPayingId(null);
    }
  }

  const tabs = [
    ['all', 'Tümü'], ['approved', 'Yayında'], ['pending', 'Onay'], ['passive', 'Pasif'], ['sold', 'Satıldı'], ['rejected', 'Reddedildi']
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-7xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700"><BarChart3 size={14}/> Satıcı paneli</div>
            <h2 className="mt-2 text-2xl font-black">İlanlarım</h2>
            <p className="mt-1 text-sm text-slate-500">İlanlarını yönet, performansı gör, pasife al, tekrar yayına gönder veya premium yap.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadListings} disabled={loading} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm disabled:opacity-60">
              <span className="inline-flex items-center gap-2"><RefreshCw size={15} /> Yenile</span>
            </button>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X /></button>
          </div>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={BarChart3} label="Toplam" value={stats.total} />
          <StatCard icon={PlayCircle} label="Yayında" value={stats.active} />
          <StatCard icon={RefreshCw} label="Onay" value={stats.pending} />
          <StatCard icon={Eye} label="Görüntüleme" value={stats.views} />
          <StatCard icon={Heart} label="Favori" value={stats.favorites} />
          <StatCard icon={MessageCircle} label="Mesaj" value={stats.messages} />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} className={`rounded-2xl px-4 py-2 text-xs font-black ring-1 ${filter === key ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-700 ring-slate-200'}`}>{label}</button>
          ))}
        </div>

        {loading && <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">İlanların yükleniyor...</div>}
        {!loading && errorText && <div className="rounded-3xl bg-red-50 p-6 text-sm font-semibold text-red-700 ring-1 ring-red-100">{errorText}</div>}
        {!loading && !errorText && filteredItems.length === 0 && <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">Bu filtrede ilan yok.</div>}

        {!loading && !errorText && filteredItems.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => {
              const image = getListingImage(item);
              const isPremium = Boolean(item.is_featured || item.is_premium);
              const isBusy = busyId === item.id;
              return (
                <div key={item.id} className={`overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ${isPremium ? 'ring-amber-300' : 'ring-slate-200'}`}>
                  <div className="relative h-48 bg-slate-100">
                    {image ? <img src={image} alt={item.title || 'İlan görseli'} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">Görsel yok</div>}
                    <div className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-black ring-1 backdrop-blur-sm ${statusClass(item.status)}`}>{statusLabel(item.status)}</div>
                    {isPremium && <div className="absolute right-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-white shadow-sm">Öne çıkan</div>}
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">{item.category || 'Kategori'} {item.subcategory ? `• ${item.subcategory}` : ''}</p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-black text-slate-950">{item.title || 'Başlıksız ilan'}</h3>
                    <p className="mt-2 text-xl font-black text-slate-950">{formatPrice(item)}</p>
                    <p className="mt-3 flex items-center gap-1 text-sm text-slate-500"><MapPin size={15} /> {item.location || 'Konum yok'}</p>

                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-200">
                      <div><p className="text-sm font-black">{Number(item.view_count || item.views || 0)}</p><p className="text-[11px] font-bold text-slate-500">Görüntüleme</p></div>
                      <div><p className="text-sm font-black">{Number(item.favorite_count || 0)}</p><p className="text-[11px] font-bold text-slate-500">Favori</p></div>
                      <div><p className="text-sm font-black">{Number(item.message_count || 0)}</p><p className="text-[11px] font-bold text-slate-500">Mesaj</p></div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {['approved', 'pending'].includes(item.status) && !isPremium && <button onClick={() => setPremiumTarget(item)} disabled={isBusy} className="rounded-2xl bg-amber-500 px-3 py-2 text-xs font-black text-white shadow-sm ring-1 ring-amber-300 disabled:opacity-60"><span className="inline-flex items-center gap-1"><Crown size={13} />Premium Yap</span></button>}
                      <button onClick={() => setEditing(item)} disabled={isBusy} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm ring-1 ring-slate-200"><span className="inline-flex items-center gap-1"><Pencil size={13} />Düzenle</span></button>
                      {item.status === 'approved' && <button onClick={() => runListingAction(item, 'pause', 'İlanı pasife almak istiyor musun?')} disabled={isBusy} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm ring-1 ring-slate-200"><span className="inline-flex items-center gap-1"><PauseCircle size={13} />Pasife al</span></button>}
                      {['passive', 'rejected', 'sold'].includes(item.status) && <button onClick={() => runListingAction(item, 'republish', 'İlan tekrar admin onayına gönderilecek. Devam?')} disabled={isBusy} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm ring-1 ring-emerald-100"><span className="inline-flex items-center gap-1"><PlayCircle size={13} />Tekrar yayınla</span></button>}
                      {item.status === 'approved' && <button onClick={() => runListingAction(item, 'mark_sold', 'İlanı satıldı olarak işaretlemek istiyor musun?')} disabled={isBusy} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm ring-1 ring-blue-100"><span className="inline-flex items-center gap-1"><CheckCircle2 size={13} />Satıldı</span></button>}
                      <button onClick={() => handleDelete(item.id)} disabled={isBusy} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-red-600 shadow-sm ring-1 ring-red-100"><span className="inline-flex items-center gap-1"><Trash2 size={13} />Sil</span></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {premiumTarget && (
          <div className="fixed inset-0 z-[60] bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="mx-auto max-w-3xl rounded-3xl bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800"><Crown size={14}/> Premium paket seç</div>
                  <h3 className="mt-2 text-xl font-black">{premiumTarget.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">Ödeme tamamlanınca ilan otomatik premium/öne çıkan olarak işaretlenir.</p>
                </div>
                <button onClick={() => setPremiumTarget(null)} className="rounded-full p-2 hover:bg-slate-100"><X /></button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {premiumPlans.map((plan) => (
                  <button key={plan.id} onClick={() => handlePremium(premiumTarget, plan.id)} disabled={Boolean(payingId)} className={`rounded-3xl border p-4 text-left shadow-sm disabled:opacity-60 ${plan.highlighted ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                    <div className="text-sm font-black text-slate-900">{plan.name}</div>
                    <div className="mt-2 text-2xl font-black">{formatPlanPrice(plan)}</div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{plan.description}</p>
                    <div className="mt-4 rounded-2xl bg-slate-950 px-3 py-2 text-center text-xs font-black text-white">{payingId === `${premiumTarget.id}:${plan.id}` ? 'Yönlendiriliyor...' : 'Satın al'}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {editing && <EditListingModal user={currentUser || user} listing={editing} onClose={() => setEditing(null)} onUpdated={() => { setEditing(null); loadListings(); }} />}
      </div>
    </div>
  );
}
