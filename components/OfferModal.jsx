'use client';

import { useMemo, useState } from 'react';
import { X, HandCoins, ShieldCheck, AlertTriangle } from 'lucide-react';
import { createOffer } from '@/lib/offers';

function formatXpf(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} XPF`;
}

export default function OfferModal({ listing, user, onClose, onCreated }) {
  const suggested = useMemo(() => {
    const price = Number(listing?.price || 0);
    if (!price) return '';
    return Math.round(price * 0.92);
  }, [listing?.price]);

  const [amount, setAmount] = useState(suggested || '');
  const [message, setMessage] = useState('Merhaba, bu fiyat üzerinden değerlendirebilir misiniz?');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  async function submitOffer() {
    setErrorText('');

    if (!user?.id) {
      setErrorText('Teklif göndermek için giriş yapmalısın.');
      return;
    }

    if (!listing?.user_id) {
      setErrorText('Satıcı bilgisi eksik olduğu için teklif gönderilemiyor.');
      return;
    }

    if (listing.user_id === user.id) {
      setErrorText('Kendi ilanına teklif gönderemezsin.');
      return;
    }

    try {
      setSubmitting(true);
      await createOffer({
        listingId: listing.id,
        buyerId: user.id,
        sellerId: listing.user_id,
        amount,
        message,
      });
      onCreated?.();
      onClose?.();
      alert('Teklif gönderildi. Satıcı teklifini panelinden görebilecek.');
    } catch (error) {
      setErrorText(error.message || 'Teklif gönderilemedi. SQL dosyasını çalıştırdığını kontrol et.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-lg rounded-[2rem] bg-white p-5 shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-200">
              <HandCoins size={14} /> Güvenli teklif
            </div>
            <h2 className="mt-3 text-2xl font-black text-slate-950">Teklif gönder</h2>
            <p className="mt-1 text-sm text-slate-500">Satıcıya fiyat teklifini gönder. Ödeme platform dışında yapılacaksa ürünü görmeden para gönderme.</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-slate-50 p-2 ring-1 ring-slate-200 hover:bg-slate-100"><X /></button>
        </div>

        <div className="mt-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div className="text-xs font-black uppercase tracking-wide text-slate-400">İlan</div>
          <div className="mt-1 font-black text-slate-950">{listing?.title}</div>
          <div className="mt-1 text-sm font-bold text-slate-600">İlan fiyatı: {listing?.priceText || formatXpf(listing?.price)}</div>
        </div>

        <label className="mt-5 block text-sm font-black text-slate-700">Teklif tutarı</label>
        <div className="mt-2 flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 focus-within:ring-slate-900">
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="numeric"
            className="w-full bg-transparent text-xl font-black outline-none"
            placeholder="Örn. 85000"
          />
          <span className="text-sm font-black text-slate-500">XPF</span>
        </div>

        <label className="mt-4 block text-sm font-black text-slate-700">Mesaj</label>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-3xl bg-slate-50 p-4 text-sm outline-none ring-1 ring-slate-200 focus:ring-slate-900"
          placeholder="Satıcıya kısa bir not yaz..."
        />

        {errorText && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700 ring-1 ring-red-100">{errorText}</div>}

        <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 ring-1 ring-amber-200">
          <div className="mb-1 flex items-center gap-1 font-black"><AlertTriangle size={14} /> Güvenlik</div>
          NouMarket şu an teklif aracıdır; kapora, kargo linki veya peşin transfer baskısı varsa işlemi durdur.
        </div>

        <button
          onClick={submitOffer}
          disabled={submitting}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
        >
          <ShieldCheck size={17} /> {submitting ? 'Gönderiliyor...' : 'Teklifi gönder'}
        </button>
      </div>
    </div>
  );
}
