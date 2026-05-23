import Link from 'next/link';
import { MapPin, Search, ShieldCheck, Sparkles } from 'lucide-react';
import ListingCard from '@/components/ListingCard';
import EmptyState from '@/components/EmptyState';
import { formatXpf } from '@/lib/demoData';
import { seoCategories, seoLocations } from '@/lib/seoTaxonomy';

function normalizeForCard(item) {
  const firstImage = Array.isArray(item?.listing_images)
    ? item.listing_images.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0]?.image_url
    : null;

  return {
    ...item,
    image: item.image_url || firstImage || item.image || null,
    priceText: item.priceText || formatXpf(item.price),
    isFeatured: item.is_featured || item.isFeatured || false,
    views: item.view_count || item.views || 0,
  };
}

export default function SeoLandingPage({ mode, entity, listings = [], totalCount = 0 }) {
  const isCategory = mode === 'category';
  const title = entity?.title || `${entity?.name} İlanları`;
  const description = entity?.description || `${entity?.name} için güncel ilanlar.`;
  const normalizedListings = listings.map(normalizeForCard);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                <Sparkles size={16} /> SEO landing sayfası
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/?${isCategory ? `category=${encodeURIComponent(entity.name)}` : `location=${encodeURIComponent(entity.name)}`}`} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800">
                  İlanları filtrele
                </Link>
                <Link href="/" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-100">
                  Tüm ilanlara dön
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-2xl font-black">{totalCount}</div>
                  <div className="text-xs font-semibold text-slate-500">aktif ilan</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-2xl font-black">24/7</div>
                  <div className="text-xs font-semibold text-slate-500">arama</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-2xl font-black">NC</div>
                  <div className="text-xs font-semibold text-slate-500">yerel pazar</div>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-600" /> Güven ve şikayet altyapısı</div>
                <div className="flex items-center gap-2"><Search size={17} className="text-blue-600" /> Akıllı arama ve filtreler</div>
                <div className="flex items-center gap-2"><MapPin size={17} className="text-orange-600" /> Konum bazlı keşif</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Öne çıkan ilanlar</h2>
            <p className="mt-1 text-sm text-slate-500">Bu sayfa Google’dan gelen kullanıcıyı doğrudan ilgili ilanlara taşır.</p>
          </div>
        </div>

        {normalizedListings.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {normalizedListings.map((listing) => (
              <Link key={listing.id} href={`/ilan/${listing.id}`} className="block">
                <ListingCard item={listing} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Bu sayfada henüz ilan yok" description="Seed içerik veya gerçek ilanlar eklendikçe bu landing sayfası otomatik güçlenir." />
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-black">Popüler kategoriler</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {seoCategories.map((cat) => (
                <Link key={cat.slug} href={`/kategori/${cat.slug}`} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">{cat.name}</Link>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-black">Popüler lokasyonlar</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {seoLocations.map((loc) => (
                <Link key={loc.slug} href={`/konum/${loc.slug}`} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">{loc.name}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
