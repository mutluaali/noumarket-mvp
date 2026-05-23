'use client';

import { useState } from 'react';
import { X, Crown, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { listPremiumPlans, formatPlanPrice } from '@/lib/premiumPlans';

const standardPlan = {
  id: 'standard',
  name: 'Standart',
  price: '0 XPF',
  description: 'Normal ilan yayını. Arama sonuçlarında tarih sırasına göre görünür.',
  disabled: true,
};

export default function PricingModal({ onClose, listingId: initialListingId = '' }) {
  const [listingId, setListingId] = useState(initialListingId);
  const [loadingPlan, setLoadingPlan] = useState('');
  const [message, setMessage] = useState('');
  const plans = listPremiumPlans();

  async function startCheckout(planId) {
    setMessage('');
    if (!listingId.trim()) {
      setMessage('Premium yapmak istediğin ilanın ID bilgisini gir veya İlanlarım ekranındaki Premium Yap butonunu kullan.');
      return;
    }

    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) {
      setMessage('Premium satın almak için önce giriş yapmalısın.');
      return;
    }

    setLoadingPlan(planId);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listingId.trim(), userId: user.id, planId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Stripe checkout başlatılamadı.');
      if (!result.url) throw new Error('Stripe checkout URL dönmedi.');
      window.location.href = result.url;
    } catch (error) {
      setMessage(error.message || 'Ödeme başlatılamadı.');
      setLoadingPlan('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-h-[92vh] max-w-5xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800"><Crown size={14} /> Premium gelir modeli</div>
            <h2 className="mt-2 text-2xl font-black">İlan görünürlüğünü artır</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Premium ilanlar arama sonuçlarında üstte görünür, rozet alır ve satıcı panelinde performansı takip edilir.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X /></button>
        </div>

        <div className="mb-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <label className="text-sm font-bold text-slate-700">Premium yapılacak ilan ID</label>
          <input value={listingId} onChange={(event) => setListingId(event.target.value)} placeholder="En iyi akış: İlanlarım → Premium Yap" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
          <p className="mt-2 text-xs text-slate-500">Satıcı panelinden açarsan bu alan otomatik dolar. Manuel test için Supabase listings.id de girebilirsin.</p>
        </div>

        {message && <div className="mb-5 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">{message}</div>}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-bold text-slate-500">{standardPlan.name}</div>
            <div className="mt-2 text-3xl font-black">{standardPlan.price}</div>
            <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-600">{standardPlan.description}</p>
            <button disabled className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-400"><CheckCircle2 size={16} /> Mevcut</button>
          </div>

          {plans.map((plan) => (
            <div key={plan.id} className={`relative rounded-3xl border p-5 ${plan.highlighted ? 'border-amber-200 bg-amber-50 shadow-lg shadow-amber-100' : 'border-slate-200 bg-white'}`}>
              {plan.badge && <div className="absolute right-4 top-4 rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black text-white">{plan.badge}</div>}
              <div className={`flex items-center gap-2 text-sm font-bold ${plan.highlighted ? 'text-amber-800' : 'text-slate-500'}`}>{plan.highlighted && <Crown size={17} />}{plan.name}</div>
              <div className="mt-2 text-3xl font-black">{formatPlanPrice(plan)}</div>
              <p className={`mt-3 min-h-[72px] text-sm leading-6 ${plan.highlighted ? 'text-amber-900' : 'text-slate-600'}`}>{plan.description}</p>
              <button disabled={loadingPlan === plan.id} onClick={() => startCheckout(plan.id)} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ${plan.highlighted ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-950 text-white hover:bg-slate-800'} disabled:opacity-60`}>
                {loadingPlan === plan.id ? <><Loader2 size={16} className="animate-spin" /> Yönlendiriliyor...</> : 'Stripe ile satın al'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
