import { supabase } from './supabase';

function escapeFilterValue(value) {
  return String(value || '').replace(/[%_,]/g, ' ').trim();
}

export function buildSearchQuery({
  query = '',
  category = 'Tümü',
  location = 'Tümü',
  minPrice = '',
  maxPrice = '',
  sort = 'newest',
  includePending = false,
  limit = 80,
} = {}) {
  let request = supabase
    .from('listings')
    .select('*, listing_images(image_url, sort_order)')
    .limit(limit);

  if (!includePending) request = request.eq('status', 'approved');

  const cleanQuery = escapeFilterValue(query);
  if (cleanQuery) {
    request = request.or([
      `title.ilike.%${cleanQuery}%`,
      `description.ilike.%${cleanQuery}%`,
      `location.ilike.%${cleanQuery}%`,
      `category.ilike.%${cleanQuery}%`,
      `subcategory.ilike.%${cleanQuery}%`,
    ].join(','));
  }

  const cleanCategory = String(category || '').trim();
  if (cleanCategory && cleanCategory !== 'Tümü') {
    const leaf = cleanCategory.split('>').map((x) => x.trim()).filter(Boolean).at(-1) || cleanCategory;
    request = request.or(`category.ilike.%${leaf}%,subcategory.ilike.%${leaf}%`);
  }

  if (location && location !== 'Tümü') request = request.eq('location', location);

  const min = Number(String(minPrice).replace(/\D/g, ''));
  const max = Number(String(maxPrice).replace(/\D/g, ''));
  if (minPrice !== '' && Number.isFinite(min)) request = request.gte('price', min);
  if (maxPrice !== '' && Number.isFinite(max)) request = request.lte('price', max);

  request = request.order('is_featured', { ascending: false });
  if (sort === 'price_low') request = request.order('price', { ascending: true, nullsFirst: false });
  else if (sort === 'price_high') request = request.order('price', { ascending: false, nullsFirst: false });
  else if (sort === 'popular') request = request.order('view_count', { ascending: false });
  else request = request.order('created_at', { ascending: false });

  return request;
}

export async function searchListings(filters = {}) {
  const { data, error } = await buildSearchQuery(filters);
  if (error) throw error;
  return data || [];
}
