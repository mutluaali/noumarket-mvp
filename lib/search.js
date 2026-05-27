import { supabase } from './supabase';

const ADVANCED_SELECT = 'id,title,description,price,currency,location,category,subcategory,category_id,subcategory_id,brand,model,status,is_featured,featured_until,created_at,updated_at,view_count,image_url,user_id,attributes,listing_images(image_url,sort_order)';
const BASIC_SELECT = 'id,title,description,price,currency,location,category,subcategory,status,is_featured,featured_until,created_at,updated_at,view_count,image_url,user_id,listing_images(image_url,sort_order)';

function escapeFilterValue(value) {
  return String(value || '').replace(/[%,_()&|]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isMissingColumn(error) {
  return /column .* does not exist|schema cache|Could not find|PGRST204/i.test(error?.message || error?.details || '');
}

function applyFilters(request, {
  query = '',
  category = 'Tümü',
  location = 'Tümü',
  minPrice = '',
  maxPrice = '',
  sort = 'newest',
  includePending = false,
} = {}) {
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

  // Kategori filtreleme app/page.jsx tarafında category_id/subcategory_id ile yapılıyor.
  // Burada label bazlı raw .or() kullanmıyoruz; PostgREST parser özel karakterlerde kırılıyor.


  if (location && location !== 'Tümü') request = request.ilike('location', `%${escapeFilterValue(location)}%`);

  const min = Number(String(minPrice).replace(/\D/g, ''));
  const max = Number(String(maxPrice).replace(/\D/g, ''));
  if (minPrice !== '' && Number.isFinite(min)) request = request.gte('price', min);
  if (maxPrice !== '' && Number.isFinite(max)) request = request.lte('price', max);

  request = request.order('is_featured', { ascending: false });
  if (sort === 'price_low' || sort === 'price_asc') request = request.order('price', { ascending: true, nullsFirst: false });
  else if (sort === 'price_high' || sort === 'price_desc') request = request.order('price', { ascending: false, nullsFirst: false });
  else if (sort === 'popular') request = request.order('view_count', { ascending: false });
  else request = request.order('created_at', { ascending: false });

  return request;
}

export function buildSearchQuery(filters = {}, selectColumns = ADVANCED_SELECT) {
  const limit = Math.min(Number(filters.limit || 40), 80);
  return applyFilters(supabase.from('listings').select(selectColumns).limit(limit), filters);
}

export async function searchListings(filters = {}) {
  let { data, error } = await buildSearchQuery(filters, ADVANCED_SELECT);

  if (error && isMissingColumn(error)) {
    console.warn('searchListings basic select fallback:', error.message || error);
    ({ data, error } = await buildSearchQuery(filters, BASIC_SELECT));
  }

  if (error) {
    console.warn('searchListings fallback:', error.message || error);
    return [];
  }

  return data || [];
}
