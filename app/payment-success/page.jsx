'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Ödeme doğrulanıyor...');

  useEffect(() => {
    async function verifyPayment() {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          setStatus('error');
          setMessage('Session ID bulunamadı. Premium işlem doğrulanamadı.');
          return;
        }

        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Ödeme doğrulanamadı.');
        }

        setStatus('success');
        setMessage('Ödeme başarılı. İlan premium yapıldı.');
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Ödeme doğrulanamadı.');
      }
    }

    verifyPayment();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl text-center">
        <div className="mb-4 text-4xl">
          {status === 'loading' ? '⏳' : status === 'success' ? '✅' : '⚠️'}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          {status === 'success' ? 'Premium aktif' : status === 'error' ? 'İşlem kontrol edilmeli' : 'Kontrol ediliyor'}
        </h1>

        <p className="text-slate-600 mb-6">{message}</p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-white font-semibold hover:bg-slate-800"
        >
          Ana sayfaya dön
        </Link>
      </section>
    </main>
  );
}
