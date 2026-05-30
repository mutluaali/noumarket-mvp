'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, HandCoins, RefreshCw, CheckCircle2, Ban, Clock } from 'lucide-react';
import { getMyOffers, updateOfferStatus } from '@/lib/offers';

function money(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} XPF`;
}

function badge(status) {
  if (status === 'accepted') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status === 'rejected' || status === 'cancelled') return 'bg-red-50 text-red-700 ring-red-200';
  return 'bg-amber-50 text-amber-700 ring-amber-200';
}

export default function OffersModal({ user, onClose }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [busy, setBusy] = useState('');

  async function loadOffers() {
    if (!user?.id) {
      setOffers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorText('');
    try {
      setOffers(await getMyOffers(user.id));
    } catch (error) {
      setErrorText(error.message || 'Teklifler yüklenemedi. SQL dosyasını çalıştırdığını kontrol et.');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOffers(); }, [user?.id]);

  const incoming = useMemo(() => offers.filter((offer) => offer.seller_id === user?.id), [offers, user?.id]);
  const outgoing = useMemo(() => offers.filter((offer) => offer.buyer_id === user?.id), [offers, user?.id]);

  async function changeStatus(offerId, status) {
    try {
      setBusy(offerId);
      await updateOfferStatus({ offerId, userId: user.id, status });
      await loadOffers();
    } catch (error) {
      alert(error.message || 'Teklif güncellenemedi.');
    } finally {
      setBusy('');
    }
  }

  function OfferCard({ offer, type }) {
    const listing = offer.listings || {};
    return (
      <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${badge(offer.status)}`}>{offer.status || 'pending'}</span>
            <h3 className="mt-3 font-black text-slate-950">{listing.title || 'İlan'}</h3>
            <p className="mt-1 text-sm text-slate-500">{listing.category || '-'} · {listing.location || '-'}</p>
            <p className="mt-3 text-2xl font-black text-slate-950">{money(offer.amount)}</p>
            {offer.message && <p className="mt-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-100">{offer.message}</p>}
          </div>
          {type === 'incoming' && offer.status === 'pending' && (
            <div className="flex shrink-0 gap-2">
              <button disabled={busy === offer.id} onClick={() => changeStatus(offer.id, 'accepted')} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white"><CheckCircle2 size={14} className="inline" /> Kabul</button>
              <button disabled={busy === offer.id} onClick={() => changeStatus(offer.id, 'rejected')} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black"><Ban size={14} className="inline" /> Reddet</button>
            </div>
          )}
          {type === 'outgoing' && offer.status === 'pending' && (
            <button disabled={busy === offer.id} onClick={() => changeStatus(offer.id, 'cancelled')} className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black">İptal et</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-5xl overflow-auto rounded-[2rem] bg-slate-50 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white"><HandCoins size={14} /> Pazarlık merkezi</div>
            <h2 className="mt-3 text-2xl font-black text-slate-950">Tekliflerim</h2>
            <p className="mt-1 text-sm text-slate-500">Gelen ve gönderilen fiyat tekliflerini buradan yönet.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadOffers} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold"><RefreshCw size={15} className="inline" /> Yenile</button>
            <button onClick={onClose} className="rounded-full bg-white p-2 ring-1 ring-slate-200"><X /></button>
          </div>
        </div>

        {errorText && <div className="mt-5 rounded-3xl bg-red-50 p-4 text-sm font-semibold text-red-700 ring-1 ring-red-100">{errorText}</div>}
        {loading && <div className="mt-5 rounded-3xl bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">Teklifler yükleniyor...</div>}

        {!loading && !errorText && (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><Clock size={18} /> Gelen teklifler ({incoming.length})</h3>
              <div className="space-y-3">
                {incoming.length === 0 && <div className="rounded-3xl bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">Henüz gelen teklif yok.</div>}
                {incoming.map((offer) => <OfferCard key={offer.id} offer={offer} type="incoming" />)}
              </div>
            </section>
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><HandCoins size={18} /> Gönderdiğin teklifler ({outgoing.length})</h3>
              <div className="space-y-3">
                {outgoing.length === 0 && <div className="rounded-3xl bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">Henüz teklif göndermedin.</div>}
                {outgoing.map((offer) => <OfferCard key={offer.id} offer={offer} type="outgoing" />)}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
