'use client';

import { X, MapPin, User, Phone, Mail, MessageCircle, AlertTriangle, ChevronLeft, ChevronRight, Eye, CalendarDays, Camera, Flag, HandCoins } from 'lucide-react';
import { useMemo, useState } from 'react';
import ReportListingModal from '@/components/ReportListingModal';
import OfferModal from '@/components/OfferModal';
import SellerTrustBadge from '@/components/SellerTrustBadge';

function normalizePhone(phone) {
  return String(phone || '').replace(/[^0-9]/g, '');
}

function formatDate(value) {
  if (!value) return 'Belirtilmedi';
  try {
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));
  } catch {
    return 'Belirtilmedi';
  }
}

export default function ListingDetailModal({ selected, user, onClose, onStartChat }) {
  const images = useMemo(() => selected.images?.length ? selected.images : [selected.image], [selected]);
  const [index, setIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const currentImage = images[index];
  const phone = selected.phone || selected.seller_phone;
  const email = selected.email || selected.seller_email;
  const whatsappPhone = normalizePhone(phone);

  function nextImage() {
    setIndex((current) => (current + 1) % images.length);
  }

  function prevImage() {
    setIndex((current) => (current - 1 + images.length) % images.length);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 p-3 backdrop-blur-sm md:p-6">
      <div className="mx-auto grid max-h-[94vh] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-auto bg-slate-950">
          <div className="relative h-[360px] overflow-hidden md:h-[560px]">
            <img src={currentImage} alt={selected.title} className="h-full w-full object-contain" />
            <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-900 shadow-sm backdrop-blur">
              <X />
            </button>

            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-sm backdrop-blur">
                  <ChevronLeft />
                </button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 shadow-sm backdrop-blur">
                  <ChevronRight />
                </button>
                <div className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-900 shadow-sm">
                  <Camera size={14} /> {index + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-slate-950 p-3">
              {images.map((image, imageIndex) => (
                <button
                  key={`${image}-${imageIndex}`}
                  onClick={() => setIndex(imageIndex)}
                  className={`h-20 w-24 shrink-0 overflow-hidden rounded-2xl ring-2 ${imageIndex === index ? 'ring-amber-300' : 'ring-transparent opacity-70'}`}
                >
                  <img src={image} alt="İlan fotoğrafı" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="max-h-[94vh] overflow-auto p-5 md:p-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">{selected.category}{selected.subcategory ? ` / ${selected.subcategory}` : ''}</span>
            {selected.isFeatured && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">Premium</span>}
          </div>

          <h2 className="text-3xl font-black leading-tight text-slate-950">{selected.title}</h2>
          <div className="mt-4 text-4xl font-black tracking-tight">{selected.priceText}</div>

          <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><MapPin size={17} /> {selected.location}</div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><Eye size={17} /> {selected.views || 0} görüntülenme</div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><CalendarDays size={17} /> {formatDate(selected.created_at)}</div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><Camera size={17} /> {images.length} fotoğraf</div>
          </div>


          {selected.metadata && Object.entries(selected.metadata).filter(([, value]) => value && typeof value !== 'object').length > 0 && (
            <div className="mt-7">
              <h3 className="text-lg font-black">İlan özellikleri</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {Object.entries(selected.metadata).filter(([, value]) => value && typeof value !== 'object').map(([key, value]) => (
                  <div key={key} className="rounded-2xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-400">{key.replaceAll('_', ' ')}</div>
                    <div className="mt-1 font-bold text-slate-800">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7">
            <h3 className="text-lg font-black">Açıklama</h3>
            <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
              {selected.description || 'Açıklama girilmemiş.'}
            </p>
          </div>

          <aside className="mt-7 rounded-[2rem] bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="mb-4 text-sm font-black text-slate-500">Satıcı bilgileri</div>
            <div className="flex items-center gap-2 text-lg font-black">
              <User size={18} /> {selected.seller || selected.seller_name || 'Satıcı'}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <Phone size={16} /> {phone || 'Telefon yok'}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
              <Mail size={16} /> {email || 'E-posta yok'}
            </div>

            <div className="mt-4">
              <SellerTrustBadge listing={selected} />
            </div>

            <button
              onClick={onStartChat}
              disabled={!user}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <MessageCircle size={17} /> Site içi mesaj gönder
            </button>


            <button
              onClick={() => setOfferOpen(true)}
              disabled={!user || selected.user_id === user?.id}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 disabled:opacity-50"
            >
              <HandCoins size={17} /> Teklif gönder
            </button>

            {whatsappPhone && (
              <a
                href={`https://wa.me/${whatsappPhone}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800"
              >
                <MessageCircle size={17} /> WhatsApp ile yaz
              </a>
            )}

            {!user && (
              <p className="mt-3 text-xs text-slate-500">
                Site içi mesaj göndermek için giriş yapmalısın.
              </p>
            )}

            <button
              onClick={() => setReportOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700"
            >
              <Flag size={17} /> İlanı şikayet et
            </button>

            <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 ring-1 ring-amber-200">
              <div className="mb-1 flex items-center gap-1 font-black">
                <AlertTriangle size={14} /> Güvenlik uyarısı
              </div>
              Ödeme yapmadan önce ürünü gör. Kapora, peşin transfer ve sahte nakliye linklerine karşı dikkatli ol.
            </div>
          </aside>
        </div>
      </div>
      {reportOpen && (
        <ReportListingModal user={user} listing={selected} onClose={() => setReportOpen(false)} />
      )}
      {offerOpen && (
        <OfferModal user={user} listing={selected} onClose={() => setOfferOpen(false)} />
      )}
    </div>
  );
}
