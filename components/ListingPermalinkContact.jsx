'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Phone } from 'lucide-react';

function cleanPhone(value) {
  return String(value || '').replace(/[^0-9+]/g, '');
}

export default function ListingPermalinkContact({
  listingId,
  sellerId,
  phone = '',
  sellerSuspended = false,
}) {
  const [phoneVisible, setPhoneVisible] = useState(false);
  const telPhone = cleanPhone(phone);
  const whatsappPhone = telPhone.replace(/^\+/, '');

  if (sellerSuspended) {
    return (
      <div className="mt-4 space-y-3">
        <div className="text-sm font-black text-slate-700">Satıcıyla iletişime geç</div>
        <div className="rounded-lg bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-800 ring-1 ring-rose-100">
          Bu satıcıya şu anda ulaşılamıyor. Satıcı hesabı geçici olarak askıda olduğu için mesaj, telefon ve WhatsApp iletişimi kapalı.
        </div>
        <button
          type="button"
          disabled
          className="flex min-h-[48px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-200 px-4 py-3 text-sm font-black text-slate-500"
        >
          <MessageCircle size={17} /> Mesaj gönder
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="text-sm font-black text-slate-700">Satıcıyla iletişime geç</div>

      {sellerId && listingId ? (
        <Link
          href={`/?openListing=${encodeURIComponent(listingId)}`}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-3 text-sm font-black text-white hover:bg-cyan-800"
        >
          <MessageCircle size={17} /> Mesaj gönder
        </Link>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
          Mesaj göndermek için satıcı bilgisi eksik.
        </div>
      )}

      {whatsappPhone ? (
        <a
          href={`https://wa.me/${whatsappPhone}`}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900 hover:bg-emerald-100"
        >
          <MessageCircle size={17} /> WhatsApp ile iletişime geç
        </a>
      ) : (
        <div className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
          WhatsApp kullanılamıyor (telefon bilgisi yok)
        </div>
      )}

      {telPhone ? (
        phoneVisible ? (
          <a
            href={`tel:${telPhone}`}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <Phone size={16} /> Ara · {phone}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setPhoneVisible(true)}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <Phone size={16} /> Telefonu göster
          </button>
        )
      ) : (
        <div className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
          <Phone size={16} /> Telefon bilgisi yok
        </div>
      )}

      <p className="rounded-lg bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500 ring-1 ring-slate-200">
        Mesaj göndermek ana sayfada açılır. Giriş yapman gerekebilir; konuşmalarını alt menüdeki <strong>Mesajlar</strong> bölümünden sürdürebilirsin.
      </p>
    </div>
  );
}
