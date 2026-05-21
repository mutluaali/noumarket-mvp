'use client';

import { X, MapPin, User, Phone, Mail, MessageCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function ListingDetailModal({ selected, user, onClose, onStartChat }) {
  const images = selected.images?.length ? selected.images : [selected.image];
  const [index, setIndex] = useState(0);
  const currentImage = images[index];

  function nextImage() {
    setIndex((current) => (current + 1) % images.length);
  }

  function prevImage() {
    setIndex((current) => (current - 1 + images.length) % images.length);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-4xl overflow-auto rounded-3xl bg-white shadow-2xl">
        <div className="relative h-72 overflow-hidden md:h-96">
          <img src={currentImage} alt={selected.title} className="h-full w-full object-cover" />
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur">
            <X />
          </button>

          {images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 top-1/2 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur">
                <ChevronLeft />
              </button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur">
                <ChevronRight />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold shadow-sm">
                {index + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[1fr_280px]">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              {selected.category}
            </div>
            <h2 className="text-3xl font-black">{selected.title}</h2>
            <div className="mt-3 text-3xl font-black">{selected.priceText}</div>
            <div className="mt-3 flex items-center gap-2 text-slate-500">
              <MapPin size={18} /> {selected.location}
            </div>
            <p className="mt-6 leading-8 text-slate-700">
              {selected.description || 'Açıklama girilmemiş.'}
            </p>
          </div>

          <aside className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <div className="mb-4 text-sm font-bold text-slate-500">Satıcı bilgileri</div>
            <div className="flex items-center gap-2 text-lg font-black">
              <User size={18} /> {selected.seller || selected.seller_name || 'Satıcı'}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <Phone size={16} /> {selected.phone || selected.seller_phone || 'Telefon yok'}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
              <Mail size={16} /> {selected.email || selected.seller_email || 'E-posta yok'}
            </div>

            <button
              onClick={onStartChat}
              disabled={!user}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <MessageCircle size={17} /> Site içi mesaj gönder
            </button>

            {(selected.phone || selected.seller_phone) && (
              <a
                href={`https://wa.me/${String(selected.phone || selected.seller_phone).replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900"
              >
                <MessageCircle size={17} /> WhatsApp ile yaz
              </a>
            )}

            {!user && (
              <p className="mt-3 text-xs text-slate-500">
                Site içi mesaj göndermek için giriş yapmalısın.
              </p>
            )}

            <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 ring-1 ring-amber-200">
              <div className="mb-1 flex items-center gap-1 font-black">
                <AlertTriangle size={14} /> Güvenlik uyarısı
              </div>
              Ödeme yapmadan önce ürünü gör. Kapora ve peşin transfer konusunda dikkatli ol.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
