'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Crown, Loader2, CheckCircle2, Landmark, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { listPremiumPlans, formatPlanPrice } from '@/lib/premiumPlans';
import { formatXpfAmount, isPremiumSeller, normalizeAccountEntitlements } from '@/lib/accountPlans';
import { formatPremiumSellerPrice, PREMIUM_SELLER_PLAN } from '@/lib/sellerSubscription';
import {
  fetchMyPendingPayments,
  fetchPaymentProviders,
  startBankTransferOrder,
  startBillingPortal,
  startEpayncOrder,
  startFeaturedCheckout,
  startPremiumSellerCheckout,
} from '@/lib/monetization';

function providerIcon(key) {
  if (key === 'bank_transfer') return Landmark;
  if (key === 'epaync') return CreditCard;
  return CreditCard;
}

export default function PricingModal({ onClose, listingId: initialListingId = '', profile, entitlements }) {
  const [listingId, setListingId] = useState(initialListingId);
  const [loadingPlan, setLoadingPlan] = useState('');
  const [message, setMessage] = useState('');
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [pendingPayments, setPendingPayments] = useState([]);
  const plans = listPremiumPlans();
  const account = entitlements || normalizeAccountEntitlements(profile || {});
  const premiumSeller = isPremiumSeller(profile || account);

  const selectedProviderMeta = useMemo(
    () => providers.find((item) => item.key === selectedProvider) || null,
    [providers, selectedProvider]
  );

  useEffect(() => {
    if (initialListingId) setListingId(initialListingId);
  }, [initialListingId]);

  useEffect(() => {
    fetchPaymentProviders()
      .then((items) => {
        setProviders(items);
        const firstEnabled = items.find((item) => item.enabled);
        setSelectedProvider(firstEnabled?.key || items[0]?.key || '');
      })
      .catch(() => {});

    fetchMyPendingPayments()
      .then((items) => setPendingPayments(Array.isArray(items) ? items : []))
      .catch(() => {});
  }, []);

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

  async function getUserId() {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
  }

  async function runCheckout({ productType, planId }) {
    if (!selectedProviderMeta?.enabled) {
      setMessage(selectedProviderMeta?.disabledReason || 'Ödeme yöntemi kullanılamıyor.');
      return;
    }

    const userId = await getUserId();
    if (!userId) {
      setMessage('Öne çıkan paket satın almak için önce giriş yapmalısın.');
      return;
    }

    if (productType === 'featured_listing' && !listingId.trim()) {
      setMessage('Öne çıkarmak istediğin ilanın ID bilgisini gir veya İlanlarım ekranındaki Öne Çıkar butonunu kullan.');
      return;
    }

    setLoadingPlan(planId || PREMIUM_SELLER_PLAN.id);
    setMessage('');

    try {
      if (selectedProvider === 'bank_transfer') {
        const result = await startBankTransferOrder({
          productType,
          listingId: listingId.trim() || undefined,
          planId,
        });
        window.location.href = result.redirectUrl || `/payment-pending?orderId=${result.orderId}`;
        return;
      }

      if (selectedProvider === 'epaync') {
        const result = await startEpayncOrder({
          productType,
          listingId: listingId.trim() || undefined,
          planId,
        });
        if (!result.redirectUrl) throw new Error('EpayNC bağlantısı kullanılamıyor.');
        window.location.href = result.redirectUrl;
        return;
      }

      if (selectedProvider === 'stripe') {
        const result = productType === 'premium_seller'
          ? await startPremiumSellerCheckout({ userId })
          : await startFeaturedCheckout({ listingId: listingId.trim(), userId, planId });
        if (!result.url) throw new Error('Stripe checkout URL dönmedi.');
        window.location.href = result.url;
        return;
      }

      throw new Error('Bilinmeyen ödeme yöntemi.');
    } catch (error) {
      setMessage(error.message || 'Ödeme başlatılamadı.');
      setLoadingPlan('');
    }
  }

  async function startFeaturedPlanCheckout(planId) {
    await runCheckout({ productType: 'featured_listing', planId });
  }

  async function startSellerSubscription() {
    await runCheckout({ productType: 'premium_seller' });
  }

  async function openBillingPortal() {
    setMessage('');
    setLoadingPlan('billing_portal');
    try {
      const result = await startBillingPortal();
      if (!result.url) throw new Error('Faturalandırma portalı açılamadı.');
      window.location.href = result.url;
    } catch (error) {
      setMessage(error.message || 'Abonelik yönetimi açılamadı.');
      setLoadingPlan('');
    }
  }

  const checkoutLabel = selectedProvider === 'bank_transfer'
    ? 'Havale talebi oluştur'
    : selectedProvider === 'epaync'
      ? 'EpayNC ile öde'
      : 'Kart ile satın al';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-0 backdrop-blur-sm sm:p-4" onClick={() => onClose?.()}>
      <div onClick={(event) => event.stopPropagation()} className="mx-auto h-[100dvh] max-w-5xl overflow-auto bg-white p-4 shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800"><Crown size={14} /> Öne çıkan paketler</div>
            <h2 className="mt-2 text-xl font-black sm:text-2xl">İlan görünürlüğünü artır</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Öne çıkan ilanlar ana sayfa vitrininde görünür, rozet alır ve arama sonuçlarında üstte listelenir.</p>
          </div>
          <button onClick={() => onClose?.()} className="rounded-full p-2 hover:bg-slate-100"><X /></button>
        </div>

        {pendingPayments.length > 0 && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
            {pendingPayments.length} ödeme onay bekliyor. Ödeme onaylandıktan sonra aktif olacak.
          </div>
        )}

        <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-black text-slate-900">Ödeme yöntemi</div>
          <p className="mt-1 text-xs text-slate-500">Havale için ödeme referansı zorunludur. Ödeme alındıktan sonra genellikle 24 saat içinde onaylanır.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {providers.map((provider) => {
              const Icon = providerIcon(provider.key);
              const active = selectedProvider === provider.key;
              const disabled = !provider.enabled;
              return (
                <button
                  key={provider.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedProvider(provider.key)}
                  className={`rounded-2xl border p-3 text-left transition ${active ? 'border-slate-950 bg-white shadow-sm' : 'border-slate-200 bg-white/70'} ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-slate-400'}`}
                >
                  <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                    <Icon size={14} />
                    {provider.label}
                  </div>
                  {provider.comingSoon || disabled ? (
                    <div className="mt-1 text-[11px] font-bold text-slate-500">{provider.disabledReason || 'Kullanılamıyor'}</div>
                  ) : provider.key === 'bank_transfer' ? (
                    <div className="mt-1 text-[11px] font-bold text-emerald-700">Ödeme onaylandıktan sonra aktif olur</div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-black uppercase tracking-wide text-slate-400">Ücretsiz hesap</div>
            <h3 className="mt-2 text-2xl font-black">1 ücretsiz ilan / yıl</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">30 gün standart yayın, 5 fotoğraf ve normal sıralama. Hak bittiğinde standart ilan ücretli olur.</p>
            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">Kalan hak: {account.freeListingRemaining === Infinity ? 'Sınırsız' : account.freeListingRemaining}</div>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-lg shadow-amber-100">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-amber-950"><Crown size={14}/> Premium Satıcı</div>
            <h3 className="mt-3 text-2xl font-black">Sınırsız ilan + profesyonel satıcı güveni</h3>
            <div className="mt-2 text-lg font-black text-amber-950">{formatPremiumSellerPrice()}</div>
            <div className="mt-3 grid gap-2 text-sm font-bold text-amber-950 sm:grid-cols-2">
              {['Sınırsız standart ilan', '20 fotoğraf + video hakkı', 'Premium Satıcı rozeti', 'Mağaza/profil sayfası', 'Öncelikli sıralama', 'Öne çıkarma indirimi'].map((item) => <div key={item} className="flex gap-2"><CheckCircle2 size={16}/>{item}</div>)}
            </div>
            {premiumSeller ? (
              <button type="button" disabled={loadingPlan === 'billing_portal'} onClick={openBillingPortal} className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                {loadingPlan === 'billing_portal' ? 'Açılıyor...' : 'Aboneliği yönet / iptal et'}
              </button>
            ) : (
              <button type="button" disabled={Boolean(loadingPlan)} onClick={startSellerSubscription} className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                {loadingPlan === PREMIUM_SELLER_PLAN.id ? 'Yönlendiriliyor...' : checkoutLabel}
              </button>
            )}
          </div>
        </div>

        <div className="mb-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <label className="text-sm font-bold text-slate-700">Öne çıkarılacak ilan ID</label>
          <input value={listingId} onChange={(event) => setListingId(event.target.value)} placeholder="En iyi akış: İlanlarım → Öne Çıkar" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
          <p className="mt-2 text-xs text-slate-500">Satıcı panelinden açarsan bu alan otomatik dolar.</p>
        </div>

        {message && <div className="mb-5 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">{message}</div>}

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className={`relative rounded-3xl border p-5 ${plan.highlighted ? 'border-amber-200 bg-amber-50 shadow-lg shadow-amber-100' : 'border-slate-200 bg-white'}`}>
              {plan.badge && <div className="absolute right-4 top-4 rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black text-white">{plan.badge}</div>}
              <div className={`flex items-center gap-2 text-sm font-bold ${plan.highlighted ? 'text-amber-800' : 'text-slate-500'}`}>{plan.highlighted && <Crown size={17} />}{plan.name}</div>
              <div className="mt-2 text-3xl font-black">{formatPlanPrice(plan, { isPremiumSeller: premiumSeller })}</div>
              {premiumSeller && plan.premiumSellerAmount ? <div className="mt-1 text-xs font-bold text-emerald-700">Premium Satıcı indirimi uygulandı</div> : null}
              <p className={`mt-3 min-h-[72px] text-sm leading-6 ${plan.highlighted ? 'text-amber-900' : 'text-slate-600'}`}>{plan.description}</p>
              <button disabled={loadingPlan === plan.id} onClick={() => startFeaturedPlanCheckout(plan.id)} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ${plan.highlighted ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-950 text-white hover:bg-slate-800'} disabled:opacity-60`}>
                {loadingPlan === plan.id ? <><Loader2 size={16} className="animate-spin" /> Yönlendiriliyor...</> : checkoutLabel}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
