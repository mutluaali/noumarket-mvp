'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('NouMarket page error:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle size={28} />
        </div>

        <h1 className="text-2xl font-black text-slate-950">
          Bir şey ters gitti
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sayfa beklenmeyen bir hata aldı. Bu artık boş ekran veya sonsuz yüklenme yerine görünür hata olarak yakalanıyor.
        </p>

        {error?.message && (
          <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-left text-xs font-semibold text-slate-700">
            {error.message}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white"
          >
            <RefreshCw size={16} />
            Tekrar dene
          </button>

          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800"
          >
            <Home size={16} />
            Ana sayfaya dön
          </button>
        </div>
      </div>
    </main>
  );
}
