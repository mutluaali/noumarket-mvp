import { notFound } from 'next/navigation';
import { tryCreateServiceRoleClient } from '@/lib/envGuards';
import SeoLandingPage from '@/components/seo/SeoLandingPage';
import { getCategoryBySlug } from '@/lib/seoTaxonomy';
import { buildCategoryShareMetadata, SITE_URL } from '@/lib/seoMetadata';
import { PUBLIC_LISTING_STATUSES } from '@/lib/listingStatus';

async function getListings(categoryName) {
  const { supabase } = tryCreateServiceRoleClient();
  if (!supabase) {
    return { listings: [], totalCount: 0 };
  }

  const { data, count, error } = await supabase
    .from('listings')
    .select('*, listing_images(image_url, sort_order)', { count: 'exact' })
    .in('status', PUBLIC_LISTING_STATUSES)
    .eq('category', categoryName)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(24);

  if (error) {
    console.warn('category landing fetch warning:', error.message);
    return { listings: [], totalCount: 0 };
  }

  return { listings: data || [], totalCount: count || 0 };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  return buildCategoryShareMetadata(category);
}

export default async function CategoryLandingPage({ params }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const { listings, totalCount } = await getListings(category.name);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} ilanları`,
    description: `Yeni Kaledonya'da ${category.name.toLowerCase()} ilanlarını keşfedin.`,
    url: `${SITE_URL}/kategori/${category.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoLandingPage mode="category" entity={category} listings={listings} totalCount={totalCount} />
    </>
  );
}
