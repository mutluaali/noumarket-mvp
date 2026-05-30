'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Archive, CheckCircle2, ClipboardList, Crown, Edit3, Eye, MapPin, RefreshCw, Trash2, X } from 'lucide-react';
import { normalizeListing } from '@/lib/listings';
import EditListingModal from '@/components/EditListingModal';
import { ModalShell, SkeletonBox, EmptyState, ErrorState, LoginRequired } from '@/components/AsyncState';
import { getErrorMessage } from '@/lib/safeAsync';
import { deleteMyListing, getMyListings, updateMyListingStatus } from '@/lib/myListings';
import { formatXpf } from '@/lib/demoData';
import { ACCOUNT_PLANS, formatXpfAmount, normalizeAccountEntitlements } from '@/lib/accountPlans';
import ListingImageFallback from '@/components/ListingImageFallback';
import { pickListingImageUrl, pickListingImageUrls } from '@/lib/listingImages';

const myListingsCache = new Map();

function statusMeta(status) {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'approved') return { label: 'Yayında', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-300/20' };
  if (value === 'rejected') return { label: 'Reddedildi', className: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-300/20' };
  if (value === 'passive' || value === 'inactive') return { label: 'Pasif', className: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10' };
  if (value === 'sold') return { label: 'Satıldı', className: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/20' };
  return { label: 'Onay bekliyor', className: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-400/10 dark:text-cyan-200 dark:ring-cyan-300/20' };
}

function formatDate(value) {
  if (!value) return 'Tarih yok';
  try {
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
  } catch {
    return 'Tarih yok';
  }
}

function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ring-1 ${meta.className}`}>{meta.label}</span>;
}

function OwnerListingCard({ item, onDetail, onEdit, onPause, onMarkSold, onDelete, onFeature, busy }) {
  const image = pickListingImageUrl(item);
  const images = pickListingImageUrls(item);
  const statusValue = String(item.status || '').toLowerCase();
  const isPassive = ['passive', 'inactive'].includes(statusValue);
  const isSold = statusValue === 'sold';
  const isRejected = statusValue === 'rejected';
  const canFeature = ['approved', 'pending', 'active'].includes(statusValue);

  return (
    <article className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-950/55">
      <button type="button" onClick={onDetail} className="block w-full text-left">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-white/5">
          {image ? (
            <img src={image} alt={item.title} className="h-full w-full object-cover" />
          ) : (
            <ListingImageFallback compact secondaryLabel="" />
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <StatusBadge status={item.status} />
            {item.isFeatured ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-amber-950"><Crown size={12}/> Öne çıkan</span> : null}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xl font-black text-cyan-700 dark:text-cyan-300">{item.priceText || formatXpf(item.price)}</div>
          <h3 className="mt-1 line-clamp-2 min-h-[42px] text-sm font-black leading-5 text-slate-950 dark:text-white">{item.title}</h3>
          {isRejected && item.rejected_reason ? (
            <p className="mt-2 line-clamp-3 text-xs font-semibold leading-5 text-rose-600 dark:text-rose-300">
              <span className="font-black">Red nedeni:</span> {item.rejected_reason}
            </p>
          ) : null}
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400"><MapPin size={14}/><span className="truncate">{item.location || 'Konum belirtilmedi'}</span></div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>{Number(item.views || item.view_count || 0).toLocaleString('tr-TR')} görüntülenme</span>
            <span className="text-right">{formatDate(item.created_at)}</span>
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3 dark:border-white/10">
        <button type="button" onClick={onEdit} className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-cyan-600 px-3 py-2.5 text-xs font-black text-white hover:bg-cyan-700"><Edit3 size={15}/> Düzenle</button>
        <button type="button" onClick={onDetail} className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200"><Eye size={15}/> Detay</button>
        {!isSold ? (
          <button type="button" disabled={busy} onClick={onPause} className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-amber-50 px-3 py-2.5 text-xs font-black text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100 disabled:opacity-60 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-300/20">
            <Archive size={15}/> {isPassive ? 'Tekrar yayına al' : 'Yayından kaldır'}
          </button>
        ) : (
          <button type="button" disabled className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-3 py-2.5 text-xs font-black text-slate-400"><Archive size={15}/> Yayından kaldır</button>
        )}
        {!isSold ? (
          <button type="button" disabled={busy} onClick={onMarkSold} className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-emerald-50 px-3 py-2.5 text-xs font-black text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100 disabled:opacity-60 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-300/20">
            <CheckCircle2 size={15}/> Satıldı olarak işaretle
          </button>
        ) : (
          <button type="button" disabled className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-3 py-2.5 text-xs font-black text-slate-400"><CheckCircle2 size={15}/> Satıldı</button>
        )}
        {canFeature ? (
          <button type="button" disabled={busy} onClick={onFeature} className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-amber-400 px-3 py-2.5 text-xs font-black text-amber-950 hover:bg-amber-500 disabled:opacity-60"><Crown size={15}/> Öne çıkar</button>
        ) : (
          <button type="button" disabled className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-3 py-2.5 text-xs font-black text-slate-400"><Crown size={15}/> Öne çıkar</button>
        )}
        <button type="button" disabled={busy} onClick={onDelete} className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl bg-rose-50 px-3 py-2.5 text-xs font-black text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-300/20"><Trash2 size={15}/> Sil</button>
      </div>
    </article>
  );
}

function DetailModal({ item, onClose, onEdit }) {
  const images = pickListingImageUrls(item);
  const attrs = item.attributes || {};
  const isRejected = String(item.status || '').toLowerCase() === 'rejected';

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/65 p-0 backdrop-blur-sm sm:p-4" onClick={() => onClose?.()}>
      <div onClick={(event) => event.stopPropagation()} className="mx-auto flex h-[100dvh] max-w-5xl flex-col overflow-y-auto bg-white shadow-2xl dark:bg-slate-950 sm:max-h-[94dvh] sm:rounded-[30px]">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
          <div className="min-w-0">
            <div className="mb-1"><StatusBadge status={item.status} /></div>
            <h2 className="line-clamp-1 text-xl font-black text-slate-950 dark:text-white">{item.title}</h2>
          </div>
          <button type="button" onClick={() => onClose?.()} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"><X size={20}/></button>
        </div>

        <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="grid gap-3 sm:grid-cols-2">
              {images.length ? images.map((image, index) => (
                <img key={`${image}-${index}`} src={image} alt={item.title} className="aspect-[4/3] w-full rounded-3xl object-cover ring-1 ring-slate-200 dark:ring-white/10" />
              )) : (
                <div className="aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-slate-200 dark:ring-white/10">
                  <ListingImageFallback compact secondaryLabel="" />
                </div>
              )}
            </div>
            <section className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Açıklama</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">{item.description || 'Açıklama girilmemiş.'}</p>
            </section>
            {isRejected && item.rejected_reason ? (
              <section className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-300/20 dark:bg-rose-400/10">
                <h3 className="text-lg font-black text-rose-800 dark:text-rose-200">Red nedeni</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-rose-700 dark:text-rose-100">{item.rejected_reason}</p>
              </section>
            ) : null}
          </div>

          <aside className="space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="text-3xl font-black text-cyan-700 dark:text-cyan-300">{item.priceText || formatXpf(item.price)}</div>
              <dl className="mt-5 space-y-3 text-sm">
                {[
                  ['Kategori', item.subcategory || item.category],
                  ['Konum', item.location],
                  ['Durum', statusMeta(item.status).label],
                  ['Görüntülenme', Number(item.views || item.view_count || 0).toLocaleString('tr-TR')],
                  ['Oluşturulma', formatDate(item.created_at)],
                  ['Güncelleme', formatDate(item.updated_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 dark:border-white/10">
                    <dt className="font-bold text-slate-500 dark:text-slate-400">{label}</dt>
                    <dd className="text-right font-black text-slate-900 dark:text-white">{value || '-'}</dd>
                  </div>
                ))}
              </dl>
              {Object.keys(attrs).length ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  {Object.entries(attrs).filter(([, value]) => value !== undefined && value !== null && value !== '').map(([key, value]) => <div key={key} className="flex justify-between gap-3 py-1"><span>{key}</span><span>{String(value)}</span></div>)}
                </div>
              ) : null}
              <button type="button" onClick={onEdit} className="mt-5 w-full min-h-[48px] rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white hover:bg-cyan-700">Düzenle</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function MyListingsModal({ user, profile, entitlements, onClose, onOpenPricing, onOpenCreate }) {
  const cachedItems = user?.id ? myListingsCache.get(user.id) : null;
  const [items, setItems] = useState(cachedItems || []);
  const [loading, setLoading] = useState(Boolean(user?.id && !cachedItems));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const account = entitlements || normalizeAccountEntitlements(profile || {});
  const premium = account.accountPlan === ACCOUNT_PLANS.PREMIUM_SELLER;
  const mountedRef = useRef(true);
  const loadRunRef = useRef(0);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async ({ background = false } = {}) => {
    const loadRunId = ++loadRunRef.current;
    if (!user?.id) { setItems([]); setLoading(false); setRefreshing(false); return; }
    if (background) setRefreshing(true);
    else setLoading(true);
    setError('');
    const guardTimer = setTimeout(() => {
      if (!mountedRef.current || loadRunId !== loadRunRef.current) return;
      if (!background) {
        setError('İlanlar beklenenden uzun sürdü. Lütfen tekrar dene.');
        setLoading(false);
      }
      setRefreshing(false);
    }, background ? 8000 : 7000);
    try {
      const data = await getMyListings();
      const normalized = (data || []).map(normalizeListing);
      myListingsCache.set(user.id, normalized);
      if (!mountedRef.current || loadRunId !== loadRunRef.current) return;
      setItems(normalized);
    } catch (err) {
      if (!mountedRef.current || loadRunId !== loadRunRef.current) return;
      setError(getErrorMessage(err, 'İlanların yüklenemedi.'));
      if (!background) setItems([]);
    } finally {
      clearTimeout(guardTimer);
      if (!mountedRef.current || loadRunId !== loadRunRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) { setItems([]); setLoading(false); return; }
    const cached = myListingsCache.get(user.id);
    if (cached) {
      setItems(cached);
      setLoading(false);
      load({ background: true });
      return;
    }
    load();
  }, [load, user?.id]);

  async function pauseOrRepublish(item) {
    const isPassive = ['passive', 'inactive'].includes(String(item.status || '').toLowerCase());
    const message = isPassive
      ? 'Bu ilan tekrar onaya gönderilsin mi?'
      : 'Bu ilan yayından kaldırılsın mı? Pasif ilanlar arama sonuçlarında görünmez.';
    if (!confirm(message)) return;

    setBusyId(item.id);
    try {
      await updateMyListingStatus(item.id, isPassive ? 'republish' : 'pause');
      await load();
    } catch (err) {
      alert(err.message || 'İşlem tamamlanamadı.');
    } finally {
      setBusyId(null);
    }
  }

  async function markSold(item) {
    if (!confirm('Bu ilan satıldı olarak işaretlensin mi?')) return;
    setBusyId(item.id);
    try {
      await updateMyListingStatus(item.id, 'mark_sold');
      await load();
    } catch (err) {
      alert(err.message || 'İşlem tamamlanamadı.');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item) {
    if (!confirm('Bu ilan kalıcı olarak silinsin mi?')) return;
    setBusyId(item.id);
    try {
      await deleteMyListing(item.id);
      if (detailItem?.id === item.id) setDetailItem(null);
      await load();
    } catch (err) {
      alert(err.message || 'İlan silinemedi.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdated() {
    alert('İlan güncellendi. Değişikliklerden sonra ilan tekrar onaya gönderildi.');
    setEditItem(null);
    setDetailItem(null);
    await load();
  }

  return (
    <>
      <ModalShell eyebrow="İlanlarım" title="İlanlarını yönet" subtitle={refreshing ? 'İlanların arka planda yenileniyor.' : 'Durumunu gör, düzenle, yayından kaldır veya satıldı olarak işaretle.'} onClose={onClose} action={user?.id ? <button onClick={() => load()} className="hidden items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1 ring-slate-200 dark:text-white dark:ring-white/10 md:inline-flex"><RefreshCw size={16}/> Yenile</button> : null}>
        {user?.id ? (
          <div className="mb-4 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5 sm:grid-cols-4">
            <div><div className="text-[11px] font-black uppercase text-slate-400">Plan</div><div className="mt-1 font-black text-slate-950 dark:text-white">{premium ? 'Premium Satıcı' : 'Ücretsiz'}</div></div>
            <div><div className="text-[11px] font-black uppercase text-slate-400">Kalan hak</div><div className="mt-1 font-black text-slate-950 dark:text-white">{premium ? 'Sınırsız' : account.freeListingRemaining}</div></div>
            <div><div className="text-[11px] font-black uppercase text-slate-400">Bu yıl kullanılan</div><div className="mt-1 font-black text-slate-950 dark:text-white">{account.yearlyFreeListingUsed}/{account.yearlyFreeListingLimit}</div></div>
            <div><div className="text-[11px] font-black uppercase text-slate-400">Standart ilan</div><div className="mt-1 font-black text-slate-950 dark:text-white">{premium ? 'Ücretsiz' : formatXpfAmount(account.standardListingPrice)}</div></div>
          </div>
        ) : null}
        {!user?.id ? (
          <LoginRequired title="İlanlarını görmek için giriş yap" text="İlan yönetimi hesabına bağlıdır." />
        ) : loading ? (
          <SkeletonBox lines={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Henüz ilan yok"
            text="İlk ilanını vererek onay sürecini buradan takip edebilirsin."
            action={onOpenCreate ? <button type="button" onClick={onOpenCreate} className="min-h-[48px] rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-black text-white hover:bg-cyan-800">İlan Ver</button> : null}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">{items.map((item) => (
            <OwnerListingCard
              key={item.id}
              item={item}
              busy={busyId === item.id}
              onDetail={() => setDetailItem(item)}
              onEdit={() => setEditItem(item)}
              onPause={() => pauseOrRepublish(item)}
              onMarkSold={() => markSold(item)}
              onDelete={() => remove(item)}
              onFeature={() => onOpenPricing?.(item.id)}
            />
          ))}</div>
        )}
      </ModalShell>

      {detailItem ? <DetailModal item={detailItem} onClose={() => setDetailItem(null)} onEdit={() => { setEditItem(detailItem); setDetailItem(null); }} /> : null}
      {editItem ? <EditListingModal listing={editItem} user={user} onClose={() => setEditItem(null)} onUpdated={handleUpdated} /> : null}
    </>
  );
}
