import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200">
        <div className="text-6xl font-black text-slate-200">404</div>
        <h1 className="mt-4 text-2xl font-black text-slate-950">
          Sayfa bulunamadı
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Aradığın sayfa taşınmış, silinmiş veya yanlış bağlantı kullanılmış olabilir.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white"
        >
          Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}
