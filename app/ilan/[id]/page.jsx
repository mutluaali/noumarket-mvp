import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { AlertTriangle, ArrowLeft, CalendarDays, Camera, CheckCircle2, Crown, Eye, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Store, Tag, User } from 'lucide-react';
import ListingViewTracker from '@/components/ListingViewTracker';
import SimilarListings from '@/components/SimilarListings';
import SellerTrustBadge from '@/components/SellerTrustBadge';
import PriceWatchButton from '@/components/PriceWatchButton';
import ShareListingButton from '@/components/ShareListingButton';
import FollowSellerButton from '@/components/FollowSellerButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const fallbackImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
const listingSelect = '*, listing_images(image_url, sort_order)';

function getImages(row) {
  const related = Array.isArray(row?.listing_images)
    ? row.listing_images
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map((image) => image.image_url)
        .filter(Boolean)
    : [];

  if (related.length) return related;
  if (row?.image_url) return [row.image_url];
  return [fallbackImage];
}

function formatPrice(row) {
  const amount = Number(row?.price || 0);
  if (!amount) return 'Görüşülür';
  return `${amount.toLocaleString('fr-FR')} ${row?.currency || 'XPF'}`;
}

function formatDate(value) {
  if (!value) return 'Belirtilmedi';
  try {
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));
  } catch {
    return 'Belirtilmedi';
  }
}

function normalizePhone(phone) {
  return String(phone || '').replace(/[^0-9]/g, '');
}

function premiumIsActive(row) {
  if (!row?.is_featured) return false;
  if (!row?.featured_until) return true;
  return new Date(row.featured_until).getTime() > Date.now();
}

function getPlainMetadata(row) {
  return Object.entries(row?.metadata || {}).filter(([, value]) => value && typeof value !== 'object').slice(0, 9);
}


async function getSimilarListings(listing) {
  if (!listing?.id) return [];

  const baseSelect = 'id,title,price,currency,location,category,subcategory,image_url,is_featured,featured_until,created_at,listing_images(image_url, sort_order)';

  const { data: sameLocation, error: sameLocationError } = await supabase
    .from('listings')
    .select(baseSelect)
    .eq('status', 'approved')
    .neq('id', listing.id)
    .eq('category', listing.category)
    .eq('location', listing.location || '')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(6);

  if (!sameLocationError && sameLocation?.length >= 3) return sameLocation;

  const { data: sameCategory } = await supabase
    .from('listings')
    .select(baseSelect)
    .eq('status', 'approved')
    .neq('id', listing.id)
    .eq('category', listing.category)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(6);

  const merged = [...(sameLocation || []), ...(sameCategory || [])];
  const unique = new Map();
  merged.forEach((item) => unique.set(item.id, item));
  return Array.from(unique.values()).slice(0, 6);
}

async function getListing(id) {
  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error || !data) return null;

  const nextViewCount = Number(data.view_count || 0) + 1;
  await supabase.from('listings').update({ view_count: nextViewCount }).eq('id', id);

  return { ...data, view_count: nextViewCount };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const listing = await getListing(resolvedParams.id);

  if (!listing) {
    return { title: 'İlan bulunamadı | NouMarket' };
  }

  const title = `${listing.title} | NouMarket`;
  const description = listing.description?.slice(0, 155) || 'Yeni Kaledonya yerel ilan platformu NouMarket üzerinde yayınlanan ilan.';
  const images = getImages(listing);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: images.slice(0, 1),
      type: 'article',
    },
  };
}

export default async function ListingPage({ params }) {
  const resolvedParams = await params;
  const listing = await getListing(resolvedParams.id);

  if (!listing) notFound();

  const images = getImages(listing);
  const phone = listing.seller_phone;
  const email = listing.seller_email;
  const whatsappPhone = normalizePhone(phone);
  const isPremium = premiumIsActive(listing);
  const similarListings = await getSimilarListings(listing);
  const metadataEntries = getPlainMetadata(listing);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <ListingViewTracker listingId={listing.id} />
      <div className="mx-auto max-w-7xl px-4 py-5 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100">
            <ArrowLeft size={17} /> Ana sayfaya dön
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
            <Link href="/" className="hover:text-slate-900">NouMarket</Link>
            <span>/</span>
            <Link href={`/?category=${encodeURIComponent(listing.category || '')}`} className="hover:text-slate-900">{listing.category || 'Kategori'}</Link>
            {listing.subcategory && <><span>/</span><span className="text-slate-800">{listing.subcategory}</span></>}
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
            <div className={`grid gap-0 bg-slate-950 ${images.length > 1 ? 'lg:grid-cols-[96px_1fr]' : ''}`}>
              {images.length > 1 && (
                <div className="hidden max-h-[560px] gap-2 overflow-y-auto border-r border-white/10 bg-slate-950 p-3 lg:grid">
                  {images.map((image, index) => (
                    <a key={`${image}-${index}`} href={image} target="_blank" rel="noreferrer" className="h-16 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10 hover:ring-white/40">
                      <img src={image} alt={`${listing.title} fotoğraf ${index + 1}`} className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
              <div className="relative bg-slate-950">
              <img src={images[0]} alt={listing.title} className="h-[340px] w-full object-contain md:h-[520px]" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur">{listing.category}{listing.subcategory ? ` / ${listing.subcategory}` : ''}</span>
                {isPremium && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow-sm"><Crown size={14} /> Premium</span>}
              </div>
              <div className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-900 shadow-sm backdrop-blur"><Camera size={14} /> {images.length} fotoğraf</div>
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white p-3 lg:hidden">
                {images.map((image, index) => (
                  <a key={`${image}-${index}`} href={image} target="_blank" rel="noreferrer" className="h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 hover:ring-slate-400">
                    <img src={image} alt={`${listing.title} fotoğraf ${index + 1}`} className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-7">
              <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">{listing.title}</h1>
              <div className="mt-4 text-4xl font-black tracking-tight">{formatPrice(listing)}</div>

              <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><MapPin size={17} /> {listing.location || 'Konum yok'}</div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><Eye size={17} /> {listing.view_count || 0} görüntülenme</div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><CalendarDays size={17} /> {formatDate(listing.created_at)}</div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><ShieldCheck size={17} /> Admin onaylı</div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black">Hızlı özet</h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">Aktif ilan</span>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><span className="flex items-center gap-2 text-slate-500"><Tag size={16}/> Kategori</span><strong>{listing.category || 'Belirtilmedi'}</strong></div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><span className="flex items-center gap-2 text-slate-500"><CheckCircle2 size={16}/> Durum</span><strong>{listing.condition || listing.metadata?.condition || 'Belirtilmedi'}</strong></div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200"><span className="flex items-center gap-2 text-slate-500"><ShieldCheck size={16}/> Güven</span><strong>Admin onaylı</strong></div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-7">
              <div className="mb-4 text-sm font-black text-slate-500">Satıcı bilgileri</div>
              {listing.user_id ? (
                <Link href={`/satici/${listing.user_id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 hover:bg-slate-100">
                  <span className="flex items-center gap-2 text-lg font-black"><Store size={18} /> {listing.seller_name || 'Satıcı'}</span>
                  <span className="text-xs font-black text-slate-500">Profili gör</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 text-lg font-black"><User size={18} /> {listing.seller_name || 'Satıcı'}</div>
              )}
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-700"><Phone size={16} /> {phone || 'Telefon yok'}</div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-700"><Mail size={16} /> {email || 'E-posta yok'}</div>

              <div className="mt-4">
                <SellerTrustBadge listing={{ ...listing, phone, email, images }} />
              </div>

              {whatsappPhone && (
                <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700">
                  <MessageCircle size={17} /> WhatsApp ile yaz
                </a>
              )}

              {email && (
                <a href={`mailto:${email}?subject=NouMarket ilanı: ${encodeURIComponent(listing.title)}`} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-100">
                  <Mail size={17} /> E-posta gönder
                </a>
              )}

              <div className="mt-3 grid gap-3">
                <PriceWatchButton listingId={listing.id} currentPrice={listing.price} />
                <ShareListingButton title={listing.title} />
                {listing.user_id && <FollowSellerButton sellerId={listing.user_id} />}
              </div>
            </section>

            <section className="rounded-[2rem] bg-amber-50 p-4 text-sm leading-6 text-amber-950 ring-1 ring-amber-200">
              <div className="mb-1 flex items-center gap-2 font-black"><AlertTriangle size={17} /> Güvenlik uyarısı</div>
              Ürünü görmeden kapora gönderme. Sahte kargo linki, peşin transfer ve kimlik/fotoğraf isteyen dolandırıcılık girişimlerine dikkat et.
            </section>
          </aside>
        </div>


        {metadataEntries.length > 0 && (
          <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-7">
            <h2 className="text-xl font-black">İlan özellikleri</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metadataEntries.map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-black uppercase tracking-wide text-slate-400">{key.replaceAll('_', ' ')}</div>
                  <div className="mt-1 font-bold text-slate-800">{String(value)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-7">
          <h2 className="text-xl font-black">Açıklama</h2>
          <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-700">{listing.description || 'Açıklama girilmemiş.'}</p>
        </section>

        <SimilarListings items={similarListings} />
      </div>
    </main>
  );
}
