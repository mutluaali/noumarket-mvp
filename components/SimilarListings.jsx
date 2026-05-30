import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';
import ListingImageFallback from '@/components/ListingImageFallback';
import { pickListingImageUrl } from '@/lib/listingImages';

function formatPrice(row) {
  const amount = Number(row?.price || 0);
  if (!amount) return 'Görüşülür';
  return `${amount.toLocaleString('tr-TR')} ${row?.currency || 'XPF'}`;
}

export default function SimilarListings({ items = [] }) {
  if (!items.length) return null;

  return (
    <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-7">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 ring-1 ring-indigo-100">
            <Sparkles size={14} /> Akıllı öneri
          </div>
          <h2 className="mt-2 text-xl font-black">Benzer ilanlar</h2>
          <p className="mt-1 text-sm text-slate-500">Aynı kategori ve lokasyona göre seçildi.</p>
        </div>
        <Link href="/" className="hidden items-center gap-1 text-sm font-black text-slate-600 hover:text-slate-950 sm:inline-flex">
          Tümünü gör <ArrowRight size={15} />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const imageUrl = pickListingImageUrl(item);

          return (
            <Link key={item.id} href={`/ilan/${item.id}`} className="group overflow-hidden rounded-3xl bg-slate-50 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg">
              <div className="relative h-40 overflow-hidden bg-slate-200">
                {imageUrl ? (
                  <img src={imageUrl} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <ListingImageFallback compact secondaryLabel="" />
                )}
                {item.is_featured && <span className="absolute left-3 top-3 rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black text-amber-950">Öne çıkan</span>}
              </div>
              <div className="p-4">
                <div className="line-clamp-1 text-sm font-black text-slate-950">{item.title}</div>
                <div className="mt-2 text-lg font-black">{formatPrice(item)}</div>
                <div className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-500"><MapPin size={13} /> {item.location || 'Konum belirtilmedi'}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
