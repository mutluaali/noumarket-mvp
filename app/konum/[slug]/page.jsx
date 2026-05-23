import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SeoLandingPage from '@/components/seo/SeoLandingPage';
import { getLocationBySlug } from '@/lib/seoTaxonomy';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://noumarket-mvp.vercel.app';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getListings(locationName) {
  const { data, count, error } = await supabase
    .from('listings')
    .select('*, listing_images(image_url, sort_order)', { count: 'exact' })
    .eq('status', 'approved')
    .eq('location', locationName)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(24);

  if (error) {
    console.warn('location landing fetch warning:', error.message);
    return { listings: [], totalCount: 0 };
  }

  return { listings: data || [], totalCount: count || 0 };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) return {};

  return {
    title: `${location.name} İlanları | NouMarket`,
    description: location.description,
    alternates: { canonical: `${siteUrl}/konum/${location.slug}` },
    openGraph: {
      title: `${location.name} İlanları | NouMarket`,
      description: location.description,
      url: `${siteUrl}/konum/${location.slug}`,
      siteName: 'NouMarket',
      locale: 'tr_TR',
      type: 'website',
    },
  };
}

export default async function LocationLandingPage({ params }) {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) notFound();

  const { listings, totalCount } = await getListings(location.name);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${location.name} İlanları`,
    description: location.description,
    url: `${siteUrl}/konum/${location.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoLandingPage mode="location" entity={{ ...location, title: `${location.name} İlanları` }} listings={listings} totalCount={totalCount} />
    </>
  );
}
