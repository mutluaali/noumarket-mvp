'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Landmark } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PaymentPendingPage() {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('orderId');
        if (!orderId) {
          setError('Ödeme talebi bulunamadı.');
          setLoading(false);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) {
          setError('Ödeme talebini görmek için giriş yapmalısın.');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/payments/orders?orderId=${encodeURIComponent(orderId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Ödeme talebi bulunamadı.');
        setOrder(payload.data);
      } catch (loadError) {
        setError(loadError.message || 'Ödeme talebi bulunamadı.');
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-6">
        <div className="text-sm font-bold text-slate-500">Ödeme talebin yükleniyor...</div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded-3xl bg-red-50 p-6 text-sm font-semibold text-red-700 ring-1 ring-red-100">{error || 'Ödeme talebi bulunamadı.'}</div>
        <Link href="/" className="mt-4 inline-block text-sm font-black text-slate-900">Ana sayfaya dön</Link>
      </main>
    );
  }

  const instructions = order.payment_instructions || {};

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-200 px-3 py-1 text-xs font-black text-emerald-950">
          <CheckCircle2 size={14} /> Ödeme talebi oluşturuldu
        </div>
        <h1 className="mt-4 text-2xl font-black text-slate-950">Ödeme talebin kaydedildi.</h1>
        <div className="mt-5 space-y-2 text-sm font-bold text-slate-700">
          <div>Tutar: {Number(order.amount || 0).toLocaleString('tr-TR')} {order.currency || 'XPF'}</div>
          <div>Referans: {order.reference}</div>
        </div>
        <p className="mt-5 text-sm leading-7 text-slate-700">
          Havale açıklamasına bu referansı yazarak banka transferini gerçekleştir.
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          İlanın veya aboneliğin ödeme onaylandıktan sonra aktif olacak.
        </p>
        <p className="mt-3 text-sm font-bold text-emerald-900">Ödeme onayı bekleniyor. Genellikle 24 saat içinde.</p>
      </div>

      {instructions.accountName && instructions.ibanOrRib ? (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900">
            <Landmark size={16} /> Banka bilgileri
          </div>
          <div className="mt-4 space-y-2 text-sm font-bold text-slate-700">
            <div>Alıcı: {instructions.accountName}</div>
            <div>Banka: {instructions.bankName}</div>
            <div>IBAN / RIB: {instructions.ibanOrRib}</div>
            <div>Zorunlu referans: {order.reference}</div>
          </div>
          {instructions.instructions ? (
            <p className="mt-4 text-sm leading-6 text-slate-600">{instructions.instructions}</p>
          ) : null}
        </div>
      ) : null}

      <Link href="/" className="mt-6 inline-block rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
        Ana sayfaya dön
      </Link>
    </main>
  );
}
