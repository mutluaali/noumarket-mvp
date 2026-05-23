import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';

function formatPrice(row) {
  const amount = Number(row?.price || 0);
  if (!amount) return 'Görüşülür';
  return `${amount.toLocaleString('fr-FR')} ${row?.currency || 'XPF'}`;
}

function getImage(row) {
  const images = Array.isArray(row?.listing_images)
    ? row.listing_images
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map((image) => image.image_url)
        .filter(Boolean)
    : [];

  return images[0] || row?.image_url || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';
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
        {items.map((item) => (
          <Link key={item.id} href={`/ilan/${item.id}`} className="group overflow-hidden rounded-3xl bg-slate-50 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg">
            <div className="relative h-40 overflow-hidden bg-slate-200">
              <img src={getImage(item)} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              {item.is_featured && <span className="absolute left-3 top-3 rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black text-amber-950">Premium</span>}
            </div>
            <div className="p-4">
              <div className="line-clamp-1 text-sm font-black text-slate-950">{item.title}</div>
              <div className="mt-2 text-lg font-black">{formatPrice(item)}</div>
              <div className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-500"><MapPin size={13} /> {item.location || 'Konum yok'}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
