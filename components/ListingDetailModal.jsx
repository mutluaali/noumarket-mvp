'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

function cleanPhone(value) {
  return String(value || '').replace(/[^0-9+]/g, '');
}

function formatDate(value) {
  if (!value) return 'Yeni ilan';
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return 'Yeni ilan';
  }
}

function resolveSeller(selected = {}) {
  const profile = selected.profile || selected.profiles || selected.seller_profile || {};
  const name =
    selected.seller_name ||
    selected.sellerName ||
    selected.seller ||
    profile.full_name ||
    profile.name ||
    profile.display_name ||
    selected.user_email ||
    'Satıcı bilgisi eksik';

  const phone =
    selected.seller_phone ||
    selected.sellerPhone ||
    selected.phone ||
    profile.phone ||
    profile.phone_number ||
    '';

  const email =
    selected.seller_email ||
    selected.sellerEmail ||
    selected.email ||
    profile.email ||
    '';

  const avatarLetter = String(name || 'N').trim().charAt(0).toUpperCase() || 'N';
  const verified = Boolean(selected.seller_verified || profile.verified || selected.user_id);

  return {
    name,
    phone,
    email,
    avatarLetter,
    verified,
    memberSince: selected.seller_created_at || profile.created_at || selected.created_at,
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
  const images = selected?.images?.length ? selected.images : [selected?.image].filter(Boolean);
  const [index, setIndex] = useState(0);
  const modalRef = useRef(null);
  const currentImage = images[index] || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=80';
  const seller = useMemo(() => resolveSeller(selected), [selected]);
  const whatsappPhone = cleanPhone(seller.phone);
  const hasRealSellerInfo = seller.name !== 'Satıcı bilgisi eksik' || seller.phone || seller.email;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    modalRef.current?.scrollTo({ top: 0 });
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function nextImage() {
    setIndex((current) => (current + 1) % images.length);
  }

  function prevImage() {
    setIndex((current) => (current - 1 + images.length) % images.length);
  }

  function handleShare() {
    if (onShare) return onShare(selected);
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: selected.title, text: selected.title, url: window.location.href }).catch(() => {});
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
      alert('İlan bağlantısı kopyalandı.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-0 backdrop-blur-sm md:p-4">
      <div ref={modalRef} className="mx-auto flex h-[100dvh] max-w-7xl flex-col overflow-y-auto bg-white shadow-2xl md:max-h-[94dvh] md:rounded-[2rem] lg:grid lg:grid-cols-[minmax(0,1fr)_390px] lg:overflow-hidden">
        <div className="shrink-0 bg-slate-50 lg:min-h-0 lg:shrink lg:overflow-auto">
          <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-5 sm:py-4">
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-500">{selected.category || 'İlan'}</div>
              <h2 className="line-clamp-1 text-lg font-black text-slate-950 sm:text-xl">{selected.title}</h2>
            </div>
            <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-900 hover:bg-slate-200">
              <X size={22} />
            </button>
          </div>

          <div className="p-3 sm:p-4 md:p-5">
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-sm ring-1 ring-slate-200 sm:rounded-[1.75rem]">
              <img src={currentImage} alt={selected.title} className="h-[240px] w-full object-cover sm:h-[300px] md:h-[520px]" />

              {images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm backdrop-blur hover:bg-white">
                    <ChevronLeft />
                  </button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm backdrop-blur hover:bg-white">
                    <ChevronRight />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-900 shadow-sm backdrop-blur">
                    {index + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:mt-5 sm:rounded-[1.75rem] sm:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-500">{selected.category || 'İlan'}</div>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{selected.title}</h1>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><MapPin size={16} /> {selected.location || 'Konum belirtilmedi'}</span>
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={16} /> {formatDate(selected.created_at)}</span>
                    <span className="inline-flex items-center gap-1.5"><Eye size={16} /> {selected.views || selected.view_count || 0} görüntülenme</span>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-3xl font-black text-blue-600 sm:text-4xl">{selected.priceText || 'Görüşülür'}</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">Pazarlık satıcıya bağlı</div>
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:mt-5 sm:rounded-[1.75rem] sm:p-5">
              <h3 className="text-xl font-black text-slate-950">Açıklama</h3>
              <p className="mt-4 whitespace-pre-line leading-8 text-slate-700">
                {selected.description || 'Bu ilan için açıklama girilmemiş.'}
              </p>
            </section>
          </div>
        </div>

        <aside className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-5 lg:overflow-auto lg:border-l lg:border-t-0">
          <section className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:rounded-[1.75rem] sm:p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-black text-slate-950 shadow-sm ring-1 ring-slate-200">
                {seller.avatarLetter}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-xl font-black text-slate-950">{seller.name}</h3>
                  {seller.verified && <ShieldCheck size={18} className="text-emerald-600" />}
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {seller.verified ? 'Doğrulanmış satıcı profili' : 'Doğrulanmamış satıcı'}
                </p>
                <p className="mt-1 text-xs text-slate-400">Üyelik/ilan tarihi: {formatDate(seller.memberSince)}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div className="flex items-center justify-between text-sm font-black text-slate-950">
                  <span>Güven skoru</span>
                  <span>{hasRealSellerInfo ? '80/100' : '45/100'}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className={`${hasRealSellerInfo ? 'w-4/5 bg-emerald-500' : 'w-[45%] bg-amber-500'} h-full rounded-full`} />
                </div>
              </div>

              <div className="space-y-2 rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <Phone size={16} /> {seller.phone || 'Telefon bilgisi girilmemiş'}
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <Mail size={16} /> {seller.email || 'E-posta bilgisi girilmemiş'}
                </div>
              </div>

              {!hasRealSellerInfo && (
                <div className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900 ring-1 ring-amber-200">
                  Bu ilanda satıcı adı/telefon/e-posta eksik. İlan formunda satıcı alanları doldurulmalı veya veritabanındaki eski ilanlar güncellenmeli.
                </div>
              )}
            </div>
          </section>

          <button
            onClick={onStartChat}
            disabled={!user || !selected.user_id}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageCircle size={18} /> Satıcıya mesaj gönder
          </button>

          {whatsappPhone && (
            <a
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-800 hover:bg-emerald-100"
            >
              <MessageCircle size={18} /> WhatsApp ile yaz
            </a>
          )}

          {!user && (
            <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500 ring-1 ring-slate-200">
              Site içi mesaj göndermek için giriş yapmalısın.
            </p>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button onClick={() => onFavorite?.(selected)} className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-4 text-sm font-black text-slate-800 hover:bg-slate-200">
              <Heart size={19} /> Favori
            </button>
            <button onClick={handleShare} className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-4 text-sm font-black text-slate-800 hover:bg-slate-200">
              <Share2 size={19} /> Paylaş
            </button>
            <button onClick={() => onReport?.(selected)} className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-rose-50 px-3 py-4 text-sm font-black text-rose-700 hover:bg-rose-100">
              <Flag size={19} /> Şikayet
            </button>
          </div>

          <section className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold leading-7 text-emerald-900 ring-1 ring-emerald-200 sm:rounded-[1.75rem] sm:p-5">
            <div className="mb-2 flex items-center gap-2 font-black">
              <ShieldCheck size={18} /> Güvenlik için
            </div>
            Ödeme yapmadan önce ürünü/evi gör. Platform dışı kapora isteyenlere dikkat et.
          </section>

          <section className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:rounded-[1.75rem] sm:p-5">
            <h3 className="text-lg font-black text-slate-950">Benzer ilanlar alanı</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Bir sonraki aşamada aynı kategori + aynı konum + yakın fiyat mantığıyla öneri motoru bağlanacak.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
