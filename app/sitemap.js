import { getServiceRoleConfigError, tryCreateServiceRoleClient } from '@/lib/envGuards';
import { seoCategories, seoLocations } from '@/lib/seoTaxonomy';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://noumarket-mvp.vercel.app';

export default async function sitemap() {
  const now = new Date();

  const staticRoutes = [
    { url: siteUrl, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    ...seoCategories.map((category) => ({
      url: `${siteUrl}/kategori/${category.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    })),
    ...seoLocations.map((location) => ({
      url: `${siteUrl}/konum/${location.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.75,
    })),
  ];

  if (getServiceRoleConfigError()) {
    return staticRoutes;
  }

  try {
    const { supabase } = tryCreateServiceRoleClient();
    if (!supabase) return staticRoutes;

    const { data, error } = await supabase
      .from('listings')
      .select('id, updated_at, created_at, is_featured')
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(5000);

    if (error) return staticRoutes;

    const listingRoutes = (data || []).map((listing) => ({
      url: `${siteUrl}/ilan/${listing.id}`,
      lastModified: new Date(listing.updated_at || listing.created_at || now),
      changeFrequency: listing.is_featured ? 'hourly' : 'daily',
      priority: listing.is_featured ? 0.9 : 0.7,
    }));

    return [...staticRoutes, ...listingRoutes];
  } catch (error) {
    return staticRoutes;
  }
}
