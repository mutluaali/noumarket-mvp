'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Store,
  X,
} from 'lucide-react';
import { getPublicSellerProfile, getSellerActiveListingCount, getSellerDisplayName } from '@/lib/profiles';
import { calculatePublicSellerTrust } from '@/lib/trust';
import PremiumBadge from '@/components/PremiumBadge';
import ListingImageFallback from '@/components/ListingImageFallback';
import { formatPublishedDate } from '@/lib/formatListingDate';
import { pickListingImageUrls } from '@/lib/listingImages';

function cleanPhone(value) {
  return String(value || '').replace(/[^0-9+]/g, '');
}

function formatMemberSince(value) {
  if (!value) return 'Yeni üye';
  try {
    return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(value));
  } catch {
    return 'Yeni üye';
  }
}

function categoryPath(selected = {}) {
  return [selected.category, selected.subcategory].filter(Boolean).join(' › ') || 'Genel';
}

function resolveSeller(selected = {}, sellerProfile = null) {
  const profile = sellerProfile || selected.profile || selected.profiles || selected.seller_profile || {};
  const name =
    getSellerDisplayName(profile) !== 'NouMarket satıcısı'
      ? getSellerDisplayName(profile)
      : selected.seller_name ||
        selected.sellerName ||
        selected.seller ||
        profile.full_name ||
        profile.name ||
        profile.display_name ||
        'Satıcı bilgisi eksik';

  const phone =
    profile.phone ||
    selected.seller_phone ||
    selected.sellerPhone ||
    selected.phone ||
    profile.phone_number ||
    '';

  const avatarUrl = profile.avatar_url || '';
  const avatarLetter = String(name || 'N').trim().charAt(0).toUpperCase() || 'N';
  const verified = Boolean(profile.is_verified || profile.phone_verified || selected.seller_verified || profile.verified);
  const phoneVerified = Boolean(profile.phone_verified);

  return {
    id: selected.user_id || profile.id || null,
    name,
    phone,
    avatarUrl,
    avatarLetter,
    verified,
    phoneVerified,
    location: profile.location || selected.location || '',
    bio: profile.bio || '',
    memberSince: profile.created_at || selected.seller_created_at || selected.created_at,
    responseRate: profile.response_rate,
    sellerRating: profile.seller_rating,
    profile,
  };
}

export default function ListingDetailModal({
  selected,
  user,
  onClose,
  onStartChat,
  onFavorite,
  onShare,
  onReport,
}) {
  const gallery = pickListingImageUrls(selected);
  const hasPhotos = gallery.length > 0;
  const [index, setIndex] = useState(0);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [sellerListingCount, setSellerListingCount] = useState(null);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const modalRef = useRef(null);
  const currentImage = gallery[index] || '';
  const seller = useMemo(() => resolveSeller(selected, sellerProfile), [selected, sellerProfile]);
  const sellerTrust = useMemo(() => calculatePublicSellerTrust(seller.profile || sellerProfile || {}), [seller.profile, sellerProfile]);
  const sellerUnavailable = Boolean(sellerProfile?.is_suspended);
  const whatsappPhone = cleanPhone(seller.phone);
  const telPhone = cleanPhone(seller.phone);
  const hasRealSellerInfo = seller.name !== 'Satıcı bilgisi eksik' || seller.phone || seller.location;
  const viewCount = Number(selected?.views || selected?.view_count || 0).toLocaleString('tr-TR');

  useEffect(() => {
    setIndex(0);
    setPhoneVisible(false);
  }, [selected?.id]);

  useEffect(() => {
    let mounted = true;
    const sellerId = selected?.user_id;

    async function loadSellerMeta() {
      if (!sellerId) {
        setSellerProfile(null);
        setSellerListingCount(null);
        return;
      }

      setSellerLoading(true);
      try {
        const [profile, listingCount] = await Promise.all([
          getPublicSellerProfile(sellerId),
          getSellerActiveListingCount(sellerId),
        ]);
        if (!mounted) return;
        setSellerProfile(profile);
        setSellerListingCount(listingCount);
      } catch (error) {
        console.warn('ListingDetailModal seller meta:', error);
      } finally {
        if (mounted) setSellerLoading(false);
      }
    }

    loadSellerMeta();
    return () => {
      mounted = false;
    };
  }, [selected?.user_id]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    modalRef.current?.scrollTo({ top: 0 });
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

  function nextImage() {
    setIndex((current) => (current + 1) % gallery.length);
  }

  function prevImage() {
    setIndex((current) => (current - 1 + gallery.length) % gallery.length);
  }

  function listingShareUrl() {
    if (typeof window === 'undefined' || !selected?.id) return '';
    return `${window.location.origin}/ilan/${selected.id}`;
  }

  function handleShare() {
    const url = listingShareUrl();
    if (onShare) return onShare(selected);
    if (typeof navigator !== 'undefined' && navigator.share && url) {
      navigator.share({ title: selected.title, text: selected.title, url }).catch(() => {});
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard && url) {
      navigator.clipboard.writeText(url).catch(() => {});
      alert('İlan bağlantısı kopyalandı.');
    }
  }

  function handleContactMessage() {
    if (sellerUnavailable || !selected?.user_id) return;
    onStartChat?.();
  }

  const contactBlock = (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleContactMessage}
        disabled={sellerUnavailable || !selected?.user_id}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-cyan-700/20 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MessageCircle size={18} />
        {sellerUnavailable ? 'Bu kullanıcıya şu anda mesaj gönderilemez' : 'Mesaj gönder'}
      </button>

      {sellerUnavailable ? (
        <p className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-800 ring-1 ring-rose-100">
          Satıcı hesabı askıda olduğu için mesaj, telefon ve WhatsApp iletişimi geçici olarak kapalı.
        </p>
      ) : null}

      {!sellerUnavailable && whatsappPhone ? (
        <a
          href={`https://wa.me/${whatsappPhone}`}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-black text-emerald-900 hover:bg-emerald-100"
        >
          <MessageCircle size={18} /> WhatsApp ile iletişime geç
        </a>
      ) : !sellerUnavailable ? (
        <div className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-semibold text-slate-500">
          WhatsApp kullanılamıyor (telefon bilgisi yok)
        </div>
      ) : null}

      {!sellerUnavailable && telPhone ? (
        phoneVisible ? (
          <a
            href={`tel:${telPhone}`}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          >
            <Phone size={18} /> Ara · {seller.phone}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setPhoneVisible(true)}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          >
            <Phone size={18} /> Telefonu göster
          </button>
        )
      ) : !sellerUnavailable ? (
        <div className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-semibold text-slate-500">
          <Phone size={18} /> Telefon bilgisi yok
        </div>
      ) : null}

      {!user ? (
        <p className="rounded-2xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900 ring-1 ring-amber-100">
          Mesaj göndermek için giriş yap. Mesajlaşma hesabına bağlı çalışır.
        </p>
      ) : (
        <p className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10">
          Mesaj gönderdikten sonra konuşmalarını alt menüdeki <strong>Mesajlar</strong> bölümünden sürdürebilirsin.
        </p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-0 backdrop-blur-sm md:p-4" onClick={() => onClose?.()}>
      <div
        ref={modalRef}
        onClick={(event) => event.stopPropagation()}
        className="mx-auto flex h-[100dvh] max-w-7xl flex-col overflow-y-auto bg-white pb-[calc(env(safe-area-inset-bottom)+5.5rem)] shadow-2xl dark:bg-slate-950 md:max-h-[94dvh] md:pb-0 md:rounded-[2rem] lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:overflow-hidden lg:pb-0"
      >
        <div className="shrink-0 bg-slate-50 dark:bg-slate-950 lg:min-h-0 lg:overflow-auto">
          <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-900/95 sm:px-5">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">{categoryPath(selected)}</div>
              <h2 className="line-clamp-1 text-lg font-black text-slate-950 dark:text-white">{selected.title}</h2>
            </div>
            <button type="button" onClick={() => onClose?.()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-white/10 dark:text-white" aria-label="Kapat">
              <X size={22} />
            </button>
          </div>

          <div className="p-3 sm:p-4 md:p-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900 shadow-sm ring-1 ring-slate-200 sm:rounded-[1.75rem] md:aspect-[16/10]">
              {hasPhotos ? (
                <img src={currentImage} alt={selected.title} className="h-full w-full object-cover" />
              ) : (
                <ListingImageFallback />
              )}

              {gallery.length > 1 ? (
                <>
                  <button type="button" onClick={prevImage} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-md hover:bg-white" aria-label="Önceki fotoğraf">
                    <ChevronLeft />
                  </button>
                  <button type="button" onClick={nextImage} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-md hover:bg-white" aria-label="Sonraki fotoğraf">
                    <ChevronRight />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-black text-white backdrop-blur-sm">
                    {index + 1} / {gallery.length}
                  </div>
                </>
              ) : null}
            </div>

            {gallery.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {gallery.map((image, thumbIndex) => (
                  <button
                    key={`${image}-${thumbIndex}`}
                    type="button"
                    onClick={() => setIndex(thumbIndex)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition ${thumbIndex === index ? 'ring-cyan-600' : 'ring-slate-200 opacity-80 hover:opacity-100'}`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}

            <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10 sm:mt-5 sm:rounded-[1.75rem] sm:p-5">
              <div className="flex flex-wrap items-start gap-2">
                <PremiumBadge listing={selected} />
              </div>
              <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">{selected.title}</h1>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-cyan-600" /> {selected.location || 'Konum belirtilmedi'}</span>
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} /> Yayınlanma tarihi: {formatPublishedDate(selected.created_at)}</span>
                    <span className="inline-flex items-center gap-1.5"><Eye size={15} /> {viewCount} görüntülenme</span>
                  </div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">Kategori: {categoryPath(selected)}</div>
                </div>
                <div className="shrink-0 md:text-right">
                  <div className="text-3xl font-black text-cyan-700 dark:text-cyan-300 sm:text-4xl">{selected.priceText || 'Görüşülür'}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Pazarlık satıcıya bağlıdır</div>
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10 sm:mt-5 sm:rounded-[1.75rem] sm:p-5">
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Açıklama</h3>
              <p className="mt-3 max-w-3xl whitespace-pre-line text-[15px] leading-7 text-slate-700 dark:text-slate-300">
                {selected.description || 'Bu ilan için açıklama girilmemiş.'}
              </p>
            </section>

          </div>
        </div>

        <aside className="shrink-0 border-t border-slate-200 bg-white p-3 pb-24 dark:border-white/10 dark:bg-slate-950 sm:p-5 lg:overflow-auto lg:border-l lg:border-t-0 lg:pb-5">
          <section className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10 sm:rounded-[1.75rem] sm:p-5">
            <div className="mb-1 text-xs font-black uppercase tracking-wide text-slate-400">Satıcı</div>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-2xl font-black text-slate-950 shadow-sm ring-1 ring-slate-200 dark:bg-white/10 dark:text-white">
                {seller.avatarUrl ? <img src={seller.avatarUrl} alt={seller.name} className="h-full w-full object-cover" /> : seller.avatarLetter}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-black text-slate-950 dark:text-white">{seller.name}</h3>
                  {seller.verified ? <BadgeCheck size={18} className="text-emerald-600" aria-label="Doğrulanmış satıcı" /> : null}
                </div>
                <p className="mt-0.5 text-sm font-semibold text-slate-500">{seller.verified ? 'Satıcı doğrulandı' : 'Satıcı profili'}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1"><CalendarDays size={13} /> Üye: {formatMemberSince(seller.memberSince)}</span>
                  {seller.location ? <span className="inline-flex items-center gap-1"><MapPin size={13} /> {seller.location}</span> : null}
                  {sellerListingCount !== null ? <span className="inline-flex items-center gap-1"><Store size={13} /> {sellerListingCount} aktif ilan</span> : null}
                </div>
                {seller.phoneVerified && !sellerUnavailable ? (
                  <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100">Telefon doğrulandı</span>
                ) : null}
                {sellerUnavailable ? (
                  <span className="mt-2 inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700 ring-1 ring-rose-100">Satıcı şu an ulaşılamıyor</span>
                ) : null}
              </div>
            </div>

            {seller.bio ? (
              <p className="mt-4 rounded-2xl bg-white p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950/50 dark:text-slate-300 dark:ring-white/10">{seller.bio}</p>
            ) : null}

            <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-950/50 dark:ring-white/10">
              <div className="flex items-center justify-between text-sm font-black text-slate-950 dark:text-white">
                <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-600" /> Güven skoru</span>
                <span>{sellerLoading ? '…' : `${sellerTrust.score}/100`}</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-500">{sellerTrust.level} · satıcı güveni</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className={`h-full rounded-full ${sellerTrust.color === 'emerald' ? 'bg-emerald-500' : sellerTrust.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${sellerTrust.score}%` }}
                />
              </div>
              <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {sellerTrust.checks.slice(0, 4).map((check) => (
                  <div key={check.key} className={`rounded-xl px-2.5 py-1.5 text-[11px] font-bold ${check.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                    {check.label}
                  </div>
                ))}
              </div>
            </div>

            {seller.id ? (
              <Link
                href={`/satici/${seller.id}`}
                className="mt-4 flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200"
              >
                Satıcı profili <ArrowUpRight size={16} />
              </Link>
            ) : null}

            {!hasRealSellerInfo ? (
              <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900 ring-1 ring-amber-200">
                Satıcı bilgileri eksik görünüyor. İletişime geçmeden önce satıcı profilini incele.
              </div>
            ) : null}
          </section>

          <div className="mt-4 hidden space-y-2 lg:block">{contactBlock}</div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button type="button" onClick={() => onFavorite?.(selected)} className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-2 py-3 text-xs font-black text-slate-800 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-200">
              <Heart size={18} /> Favorile
            </button>
            <button type="button" onClick={handleShare} className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-2 py-3 text-xs font-black text-slate-800 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-200">
              <Share2 size={18} /> Paylaş
            </button>
            <button type="button" onClick={() => onReport?.(selected)} className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-rose-100 bg-rose-50/80 px-2 py-3 text-xs font-black text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-200">
              <Flag size={17} /> İlanı şikayet et
            </button>
          </div>

          <section className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold leading-7 text-emerald-900 ring-1 ring-emerald-200">
            <div className="mb-1 flex items-center gap-2 font-black">
              <ShieldCheck size={17} /> Güvenlik ipuçları
            </div>
            Ödeme yapmadan önce ürünü veya mülkü yerinde gör. Platform dışında kapora isteyenlere dikkat et.
          </section>
        </aside>

        <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-slate-950/95 lg:hidden">
          <div className="mx-auto flex max-w-lg gap-2">
            <button
              type="button"
              onClick={handleContactMessage}
              disabled={sellerUnavailable || !selected?.user_id}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-4 text-sm font-black text-white disabled:opacity-50"
            >
              <MessageCircle size={17} /> {sellerUnavailable ? 'Ulaşılamıyor' : 'Mesaj gönder'}
            </button>
            {whatsappPhone && !sellerUnavailable ? (
              <a
                href={`https://wa.me/${whatsappPhone}`}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-emerald-900"
                aria-label="WhatsApp ile iletişime geç"
              >
                <MessageCircle size={20} />
              </a>
            ) : null}
            {telPhone && !sellerUnavailable ? (
              phoneVisible ? (
                <a
                  href={`tel:${telPhone}`}
                  className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-slate-800 ring-1 ring-slate-200"
                  aria-label="Ara"
                >
                  <Phone size={20} />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setPhoneVisible(true)}
                  className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-slate-800 ring-1 ring-slate-200"
                  aria-label="Telefonu göster"
                >
                  <Phone size={20} />
                </button>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
