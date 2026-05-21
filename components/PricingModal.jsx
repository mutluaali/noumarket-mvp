'use client';

import { useState } from 'react';
import { X, Crown, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const plans = [
  {
    id: 'standard',
    name: 'Standart',
    price: '0 XPF',
    description: 'Normal ilan yayını.',
    disabled: true,
  },
  {
    id: 'premium_7',
    name: 'Öne Çıkan',
    price: '1.500 XPF',
    description: '7 gün üst sıralarda görünür.',
    highlighted: true,
  },
  {
    id: 'premium_30',
    name: 'Premium 30 Gün',
    price: '5.000 XPF',
    description: '30 gün daha güçlü görünürlük.',
  },
];

export default function PricingModal({ onClose, listingId: initialListingId = '' }) {
  const [listingId, setListingId] = useState(initialListingId);
  const [loadingPlan, setLoadingPlan] = useState('');
  const [message, setMessage] = useState('');

  async function startCheckout(planId) {
    setMessage('');

    if (!listingId.trim()) {
      setMessage('Premium yapmak istediğin ilanın ID bilgisini gir.');
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
        body: JSON.stringify({
          listingId: listingId.trim(),
          userId: user.id,
          planId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Stripe checkout başlatılamadı.');
      }

      if (!result.url) {
        throw new Error('Stripe checkout URL dönmedi.');
      }

      window.location.href = result.url;
    } catch (error) {
      setMessage(error.message || 'Ödeme başlatılamadı.');
      setLoadingPlan('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">Premium görünürlük</h2>
            <p className="mt-1 text-sm text-slate-500">
              İlanını üst sıralara taşı ve daha fazla alıcıya göster.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>

        <div className="mb-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <label className="text-sm font-bold text-slate-700">Premium yapılacak ilan ID</label>
          <input
            value={listingId}
            onChange={(event) => setListingId(event.target.value)}
            placeholder="Supabase listings.id veya İlanlarım ekranından alınacak ID"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          />
          <p className="mt-2 text-xs text-slate-500">
            Şimdilik MVP test akışı için ilan ID giriyoruz. Sonraki adımda bunu “İlanlarım → Premium Yap” butonuna bağlayacağız.
          </p>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl border p-5 ${
                plan.highlighted ? 'border-amber-200 bg-amber-50 shadow-lg shadow-amber-100' : 'border-slate-200 bg-white'
              }`}
            >
              <div className={`flex items-center gap-2 text-sm font-bold ${plan.highlighted ? 'text-amber-800' : 'text-slate-500'}`}>
                {plan.highlighted && <Crown size={17} />}
                {plan.name}
              </div>
              <div className="mt-2 text-3xl font-black">{plan.price}</div>
              <p className={`mt-3 min-h-[48px] text-sm leading-6 ${plan.highlighted ? 'text-amber-900' : 'text-slate-600'}`}>
                {plan.description}
              </p>

              <button
                disabled={plan.disabled || loadingPlan === plan.id}
                onClick={() => startCheckout(plan.id)}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ${
                  plan.disabled
                    ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                    : plan.highlighted
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Yönlendiriliyor...
                  </>
                ) : plan.disabled ? (
                  'Mevcut'
                ) : (
                  'Stripe ile satın al'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
