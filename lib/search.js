import { supabase } from './supabase';

export function buildSearchQuery({
  query = '',
  category = 'Tümü',
  location = 'Tümü',
  minPrice = '',
  maxPrice = '',
  sort = 'newest',
  includePending = false,
} = {}) {
  let request = supabase
    .from('listings')
    .select('*, listing_images(image_url, sort_order)');

  if (!includePending) {
    request = request.eq('status', 'approved');
  }

  const cleanQuery = String(query || '').trim();
  if (cleanQuery) {
    request = request.or(
      [
        `title.ilike.%${cleanQuery}%`,
        `description.ilike.%${cleanQuery}%`,
        `location.ilike.%${cleanQuery}%`,
        `category.ilike.%${cleanQuery}%`,
      ].join(',')
    );
  }

  if (category && category !== 'Tümü') {
    request = request.eq('category', category);
  }

  if (location && location !== 'Tümü') {
    request = request.eq('location', location);
  }

  if (minPrice !== '' && minPrice !== null && !Number.isNaN(Number(minPrice))) {
    request = request.gte('price', Number(minPrice));
  }

  if (maxPrice !== '' && maxPrice !== null && !Number.isNaN(Number(maxPrice))) {
    request = request.lte('price', Number(maxPrice));
  }

  // Premium listings first, then selected sort.
  request = request.order('is_featured', { ascending: false });

  if (sort === 'price_low') {
    request = request.order('price', { ascending: true, nullsFirst: false });
  } else if (sort === 'price_high') {
    request = request.order('price', { ascending: false, nullsFirst: false });
  } else if (sort === 'popular') {
    request = request.order('view_count', { ascending: false });
  } else {
    request = request.order('created_at', { ascending: false });
  }

  return request;
}

export async function searchListings(filters = {}) {
  const { data, error } = await buildSearchQuery(filters);
  if (error) throw error;
  return data || [];
}
