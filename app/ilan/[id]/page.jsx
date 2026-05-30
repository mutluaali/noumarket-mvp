import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CalendarDays, Camera, CheckCircle2, Crown, Eye, MapPin, ShieldCheck, Store, Tag, User } from 'lucide-react';
import { tryCreateServiceRoleClient } from '@/lib/envGuards';
import ListingViewTracker from '@/components/ListingViewTracker';
import SimilarListings from '@/components/SimilarListings';
import SellerTrustBadge from '@/components/SellerTrustBadge';
import PriceWatchButton from '@/components/PriceWatchButton';
import ShareListingButton from '@/components/ShareListingButton';
import FollowSellerButton from '@/components/FollowSellerButton';
import ListingPermalinkContact from '@/components/ListingPermalinkContact';
import ListingPermalinkReportAction from '@/components/ListingPermalinkReportAction';
import { formatPublishedDate } from '@/lib/formatListingDate';
import { buildListingShareMetadata } from '@/lib/seoMetadata';
import { pickListingImageUrls } from '@/lib/listingImages';
import ListingImageFallback from '@/components/ListingImageFallback';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const listingSelect = '*, listing_images(image_url, sort_order)';

function getImages(row) {
  return pickListingImageUrls(row);
}

function ListingPhotoPlaceholder() {
  return <ListingImageFallback className="h-[340px] md:h-[520px]" />;
}

function formatPrice(row) {
  const amount = Number(row?.price || 0);
  if (!amount) return 'Görüşülür';
  return `${amount.toLocaleString('tr-TR')} ${row?.currency || 'XPF'}`;
}

function formatCondition(value) {
  const key = String(value || '').toLowerCase();
  const labels = {
    new: 'Yeni',
    like_new: 'Yeni gibi',
    used: 'Kullanılmış',
    damaged: 'Hasarlı',
  };
  return labels[key] || value || 'Belirtilmedi';
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

  const { supabase } = tryCreateServiceRoleClient();
  if (!supabase) return [];

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

async function getSellerContactMeta(userId) {
  if (!userId) return { sellerSuspended: false, sellerPhone: '' };

  const { supabase } = tryCreateServiceRoleClient();
  if (!supabase) return { sellerSuspended: false, sellerPhone: '' };

  const { data, error } = await supabase
    .from('profiles')
    .select('is_suspended, phone')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    if (/column .* does not exist|Could not find|PGRST204/i.test(error.message || '')) {
      const { data: fallback } = await supabase.from('profiles').select('phone').eq('id', userId).maybeSingle();
      return { sellerSuspended: false, sellerPhone: fallback?.phone || '' };
    }
    return { sellerSuspended: false, sellerPhone: '' };
  }

  if (!data) return { sellerSuspended: false, sellerPhone: '' };

  return {
    sellerSuspended: Boolean(data.is_suspended),
    sellerPhone: data.phone || '',
  };
}

async function fetchApprovedListing(id, { trackView = false } = {}) {
  const { supabase } = tryCreateServiceRoleClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error || !data) return null;

  if (!trackView) return data;

  const nextViewCount = Number(data.view_count || 0) + 1;
  await supabase.from('listings').update({ view_count: nextViewCount }).eq('id', id);

  return { ...data, view_count: nextViewCount };
}

async function getListingForMetadata(id) {
  return fetchApprovedListing(id, { trackView: false });
}

async function getListing(id) {
  return fetchApprovedListing(id, { trackView: true });
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const listing = await getListingForMetadata(resolvedParams.id);
  return buildListingShareMetadata(listing);
}

export default async function ListingPage({ params }) {
  const resolvedParams = await params;
  const listing = await getListing(resolvedParams.id);

  if (!listing) notFound();

  const images = getImages(listing);
  const sellerContact = listing.user_id ? await getSellerContactMeta(listing.user_id) : { sellerSuspended: false, sellerPhone: '' };
  const contactPhone = sellerContact.sellerPhone || listing.seller_phone || '';
  const isPremium = premiumIsActive(listing);
  const similarListings = await getSimilarListings(listing);
  const metadataEntries = getPlainMetadata(listing);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <ListingViewTracker listingId={listing.id} />
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-[-0.04em] text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-950 to-cyan-800 text-white">N</span>
            Nou<span className="text-cyan-700">Market</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:border-cyan-300 hover:bg-cyan-50">
            <ArrowLeft size={17} /> Ana sayfaya dön
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-4 py-4">
        <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
            <Link href="/" className="hover:text-slate-900">Ana sayfa</Link>
            <span>/</span>
            <Link href={`/?category=${encodeURIComponent(listing.category || '')}`} className="hover:text-slate-900">{listing.category || 'Kategori'}</Link>
            {listing.subcategory && <><span>/</span><Link href={`/?category=${encodeURIComponent(listing.category || '')}&subcategory=${encodeURIComponent(listing.subcategory || '')}`} className="text-slate-800 hover:text-cyan-700">{listing.subcategory}</Link></>}
            <span>/</span><span className="truncate text-slate-400">İlan no: {String(listing.id).slice(0,8)}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
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
              {images.length ? (
                <>
                  <img src={images[0]} alt={listing.title} className="h-[340px] w-full object-contain md:h-[520px]" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-xl bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur">{listing.category}{listing.subcategory ? ` / ${listing.subcategory}` : ''}</span>
                    {isPremium && <span className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow-sm"><Crown size={14} /> Öne çıkan ilan</span>}
                  </div>
                  <div className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-xl bg-white/90 px-3 py-1 text-xs font-black text-slate-900 shadow-sm backdrop-blur"><Camera size={14} /> {images.length} fotoğraf</div>
                </>
              ) : (
                <>
                  <ListingPhotoPlaceholder />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-xl bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur">{listing.category}{listing.subcategory ? ` / ${listing.subcategory}` : ''}</span>
                    {isPremium && <span className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow-sm"><Crown size={14} /> Öne çıkan ilan</span>}
                  </div>
                </>
              )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white p-3 lg:hidden">
                {images.map((image, index) => (
                  <a key={`${image}-${index}`} href={image} target="_blank" rel="noreferrer" className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200 hover:ring-slate-400">
                    <img src={image} alt={`${listing.title} fotoğraf ${index + 1}`} className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-7">
              <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">{listing.title}</h1>
              <div className="mt-4 text-4xl font-black tracking-tight">{formatPrice(listing)}</div>

              <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200"><MapPin size={17} /> {listing.location || 'Konum belirtilmedi'}</div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200"><Eye size={17} /> {Number(listing.view_count || 0).toLocaleString('tr-TR')} görüntülenme</div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200"><CalendarDays size={17} /> Yayınlanma tarihi: {formatPublishedDate(listing.created_at)}</div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200"><ShieldCheck size={17} /> Moderasyon onaylı</div>
              </div>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black">Hızlı özet</h2>
                <span className="rounded-md bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700 ring-1 ring-cyan-100">Aktif ilan</span>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200"><span className="flex items-center gap-2 text-slate-500"><Tag size={16}/> Kategori</span><strong>{listing.category || 'Belirtilmedi'}</strong></div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200"><span className="flex items-center gap-2 text-slate-500"><CheckCircle2 size={16}/> Durum</span><strong>{formatCondition(listing.condition || listing.metadata?.condition)}</strong></div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200"><span className="flex items-center gap-2 text-slate-500"><ShieldCheck size={16}/> Güven</span><strong>Moderasyon onaylı</strong></div>
              </div>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-7">
              <div className="mb-4 text-sm font-black text-slate-500">Satıcı bilgileri</div>
              {listing.user_id ? (
                <Link href={`/satici/${listing.user_id}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200 hover:bg-slate-100">
                  <span className="flex items-center gap-2 text-lg font-black"><Store size={18} /> {listing.seller_name || 'Satıcı'}</span>
                  <span className="text-xs font-black text-slate-500">Satıcı profili</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 text-lg font-black"><User size={18} /> {listing.seller_name || 'Satıcı'}</div>
              )}
              <ListingPermalinkContact
                listingId={listing.id}
                sellerId={listing.user_id}
                phone={contactPhone}
                sellerSuspended={sellerContact.sellerSuspended}
              />

              <div className="mt-4">
                <SellerTrustBadge listing={{ ...listing, phone: contactPhone, images }} />
              </div>

              <div className="mt-3 grid gap-3">
                <PriceWatchButton listingId={listing.id} currentPrice={listing.price} />
                <ShareListingButton title={listing.title} />
                {listing.user_id && <FollowSellerButton sellerId={listing.user_id} />}
                <ListingPermalinkReportAction
                  listingId={listing.id}
                  listingTitle={listing.title}
                  sellerId={listing.user_id}
                />
              </div>
            </section>

            <section className="rounded-md bg-amber-50 p-4 text-sm leading-6 text-amber-950 ring-1 ring-amber-200">
              <div className="mb-1 flex items-center gap-2 font-black"><AlertTriangle size={17} /> Güvenlik uyarısı</div>
              Ürünü görmeden kapora gönderme. Sahte kargo linki, peşin transfer ve kimlik/fotoğraf isteyen dolandırıcılık girişimlerine dikkat et.
            </section>
          </aside>
        </div>


        {metadataEntries.length > 0 && (
          <section className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-7">
            <h2 className="text-xl font-black">İlan özellikleri</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metadataEntries.map(([key, value]) => (
                <div key={key} className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-xs font-black uppercase tracking-wide text-slate-400">{key.replaceAll('_', ' ')}</div>
                  <div className="mt-1 font-bold text-slate-800">{String(value)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-7">
          <h2 className="text-xl font-black">Açıklama</h2>
          <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-700">{listing.description || 'Açıklama girilmemiş.'}</p>
        </section>

        <SimilarListings items={similarListings} />
      </div>
    </main>
  );
}
