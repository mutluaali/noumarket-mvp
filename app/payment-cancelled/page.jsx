import Link from 'next/link';

export const metadata = {
  title: 'Ödeme iptal edildi | NouMarket',
  robots: { index: false, follow: false },
};

export default function PaymentCancelledPage({ searchParams }) {
  const listingId = searchParams?.listing_id;

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl text-center">
        <div className="mb-4 text-4xl">↩️</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Ödeme iptal edildi</h1>
        <p className="text-slate-600 mb-6">
          Premium satın alma tamamlanmadı. İlanın normal şekilde yayında kalmaya devam eder.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-white font-semibold hover:bg-slate-800">
            Ana sayfaya dön
          </Link>
          {listingId && (
            <Link href={`/ilan/${listingId}`} className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-5 py-3 text-slate-800 font-semibold hover:bg-slate-200">
              İlanı görüntüle
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
