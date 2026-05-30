import { notFound } from 'next/navigation';
import { tryCreateServiceRoleClient } from '@/lib/envGuards';
import SeoLandingPage from '@/components/seo/SeoLandingPage';
import { PUBLIC_LISTING_STATUSES } from '@/lib/listingStatus';
import { getLocationBySlug } from '@/lib/seoTaxonomy';
import { buildLocationShareMetadata, SITE_URL } from '@/lib/seoMetadata';

async function getListings(locationName) {
  const { supabase } = tryCreateServiceRoleClient();
  if (!supabase) {
    return { listings: [], totalCount: 0 };
  }

  const { data, count, error } = await supabase
    .from('listings')
    .select('*, listing_images(image_url, sort_order)', { count: 'exact' })
    .in('status', PUBLIC_LISTING_STATUSES)
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
  return buildLocationShareMetadata(location);
}

export default async function LocationLandingPage({ params }) {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) notFound();

  const { listings, totalCount } = await getListings(location.name);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${location.name} ilanları`,
    description: `${location.name} bölgesindeki satılık, kiralık ve ikinci el ilanları.`,
    url: `${SITE_URL}/konum/${location.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoLandingPage mode="location" entity={{ ...location, title: `${location.name} ilanları` }} listings={listings} totalCount={totalCount} />
    </>
  );
}
