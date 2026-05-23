import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, BadgeCheck, CalendarDays, Clock3, Eye, MapPin, MessageCircle, Phone, ShieldCheck, Star, Store, User } from 'lucide-react';
import ListingCard from '@/components/ListingCard';
import TrustScoreCard from '@/components/TrustScoreCard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder-service-role-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const profileSelect = 'id, full_name, store_name, phone, location, bio, avatar_url, is_verified, phone_verified, phone_verification_requested_at, seller_rating, response_rate, created_at';
const listingSelect = 'id,user_id,title,description,category,subcategory,price,currency,location,seller_name,seller_phone,seller_email,image_url,status,is_featured,featured_until,view_count,created_at,metadata,listing_images(image_url, sort_order)';

function formatDate(value) {
  if (!value) return 'Yeni hesap';
  try {
    return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(value));
  } catch {
    return 'Yeni hesap';
  }
}

function normalizePhone(phone = '') {
  return String(phone || '').replace(/[^0-9]/g, '');
}

function normalizeListing(row) {
  const relatedImages = Array.isArray(row.listing_images)
    ? row.listing_images
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map((image) => image.image_url)
        .filter(Boolean)
    : [];

  const fallbackImage = row.image_url || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=80';
  const activePremium = row.is_featured && (!row.featured_until || new Date(row.featured_until).getTime() > Date.now());

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title || '',
    description: row.description || '',
    category: row.category || '',
    price: Number(row.price || 0),
    priceText: row.price ? `${Number(row.price).toLocaleString('fr-FR')} ${row.currency || 'XPF'}` : 'Görüşülür',
    location: row.location || '',
    seller: row.seller_name || '',
    phone: row.seller_phone || '',
    email: row.seller_email || '',
    image: relatedImages[0] || fallbackImage,
    images: relatedImages.length ? relatedImages : [fallbackImage],
    badge: activePremium ? 'Premium' : 'Yeni',
    status: row.status || 'approved',
    subcategory: row.subcategory || '',
    metadata: row.metadata || {},
    isFeatured: activePremium,
    featuredUntil: row.featured_until,
    views: Number(row.view_count || 0),
    created_at: row.created_at,
  };
}

async function getSeller(id) {
  const { data, error } = await supabase.from('profiles').select(profileSelect).eq('id', id).maybeSingle();

  if (!error && data) return data;

  if (error?.code === '42703') {
    const fallback = await supabase.from('profiles').select('id, full_name, phone, role, created_at').eq('id', id).maybeSingle();
    if (!fallback.error && fallback.data) return fallback.data;
  }

  return null;
}

async function getSellerListings(id) {
  const { data, error } = await supabase
    .from('listings')
    .select(listingSelect)
    .eq('user_id', id)
    .eq('status', 'approved')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(24);

  if (error || !data) return [];
  return data.map(normalizeListing);
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const seller = await getSeller(resolvedParams.id);
  if (!seller) return { title: 'Satıcı bulunamadı | NouMarket' };

  const name = seller.store_name || seller.full_name || 'NouMarket satıcısı';
  return {
    title: `${name} satıcı profili | NouMarket`,
    description: `${name} tarafından yayınlanan ilanları ve güven bilgilerini NouMarket üzerinde incele.`,
  };
}

export default async function SellerPage({ params }) {
  const resolvedParams = await params;
  const seller = await getSeller(resolvedParams.id);
  if (!seller) notFound();

  const listings = await getSellerListings(resolvedParams.id);
  const name = seller.store_name || seller.full_name || 'NouMarket satıcısı';
  const phone = seller.phone;
  const whatsappPhone = normalizePhone(phone);
  const totalViews = listings.reduce((sum, item) => sum + Number(item.views || 0), 0);
  const verified = Boolean(seller.is_verified || seller.phone_verified);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-5 md:py-8">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100">
          <ArrowLeft size={17} /> Ana sayfaya dön
        </Link>

        <section className="mt-5 overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="bg-slate-950 p-6 text-white md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white/10 ring-1 ring-white/15">
                  {seller.avatar_url ? <img src={seller.avatar_url} alt={name} className="h-full w-full object-cover" /> : <Store size={34} />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-black tracking-tight md:text-4xl">{name}</h1>
                    {verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-emerald-950"><BadgeCheck size={14} /> Doğrulanmış</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-1"><MapPin size={15} /> {seller.location || 'Konum belirtilmedi'}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays size={15} /> {formatDate(seller.created_at)} tarihinden beri</span>
                  </div>
                </div>
              </div>

              {whatsappPhone && (
                <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white hover:bg-emerald-600">
                  <MessageCircle size={17} /> WhatsApp ile yaz
                </a>
              )}
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-[0.9fr_1.1fr] md:p-7">
            <TrustScoreCard profile={seller} user={{ email: true }} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200"><div className="text-xs font-black uppercase text-slate-400">Aktif ilan</div><div className="mt-2 text-3xl font-black">{listings.length}</div></div>
              <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200"><div className="text-xs font-black uppercase text-slate-400">Toplam görüntülenme</div><div className="mt-2 flex items-center gap-2 text-3xl font-black"><Eye size={22} /> {totalViews}</div></div>
              <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200"><div className="text-xs font-black uppercase text-slate-400">Telefon</div><div className="mt-2 flex items-center gap-2 text-sm font-bold"><Phone size={17} /> {seller.phone_verified ? 'Doğrulanmış' : phone ? 'Belirtilmiş' : 'Eksik'}</div></div>
              <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200"><div className="text-xs font-black uppercase text-slate-400">Yanıt oranı</div><div className="mt-2 flex items-center gap-2 text-sm font-bold"><Clock3 size={17} /> {seller.response_rate ? `%${seller.response_rate}` : 'Henüz ölçülmedi'}</div></div>
            </div>
          </div>

          {seller.bio && <div className="border-t border-slate-200 p-5 text-sm leading-7 text-slate-700 md:p-7">{seller.bio}</div>}
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black">Satıcının ilanları</h2>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">{listings.length} ilan</span>
          </div>

          {listings.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {listings.map((listing) => <Link key={listing.id} href={`/ilan/${listing.id}`} className="block"><ListingCard item={listing} /></Link>)}
            </div>
          ) : (
            <div className="rounded-[2rem] bg-white p-8 text-center text-sm font-semibold text-slate-500 ring-1 ring-slate-200">Bu satıcının yayında ilanı yok.</div>
          )}
        </section>
      </div>
    </main>
  );
}
