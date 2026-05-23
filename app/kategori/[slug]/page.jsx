import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SeoLandingPage from '@/components/seo/SeoLandingPage';
import { getCategoryBySlug } from '@/lib/seoTaxonomy';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://noumarket-mvp.vercel.app';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getListings(categoryName) {
  const { data, count, error } = await supabase
    .from('listings')
    .select('*, listing_images(image_url, sort_order)', { count: 'exact' })
    .eq('status', 'approved')
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
  if (!category) return {};

  return {
    title: `${category.title} | NouMarket`,
    description: category.description,
    alternates: { canonical: `${siteUrl}/kategori/${category.slug}` },
    keywords: category.keywords,
    openGraph: {
      title: `${category.title} | NouMarket`,
      description: category.description,
      url: `${siteUrl}/kategori/${category.slug}`,
      siteName: 'NouMarket',
      locale: 'tr_TR',
      type: 'website',
    },
  };
}

export default async function CategoryLandingPage({ params }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const { listings, totalCount } = await getListings(category.name);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.title,
    description: category.description,
    url: `${siteUrl}/kategori/${category.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoLandingPage mode="category" entity={category} listings={listings} totalCount={totalCount} />
    </>
  );
}
