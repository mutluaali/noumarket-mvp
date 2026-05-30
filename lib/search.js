import { getPublicSupabaseConfigMessage, hasPublicSupabaseConfig } from './envGuards';
import { supabase } from './supabase';
import { PUBLIC_LISTING_STATUSES } from './listingStatus';
import { getDescendantCategoryIds } from './categorySchema';

function assertPublicSupabaseConfig() {
  if (hasPublicSupabaseConfig() && supabase) return;
  throw new Error(getPublicSupabaseConfigMessage({ detailed: process.env.NODE_ENV !== 'production' }));
}

const ADVANCED_SELECT = 'id,title,description,price,currency,location,category,subcategory,category_id,subcategory_id,brand,model,status,is_featured,featured_until,created_at,updated_at,view_count,image_url,user_id,attributes,listing_images(image_url,sort_order)';
const BASIC_SELECT = 'id,title,description,price,currency,location,category,subcategory,status,is_featured,featured_until,created_at,updated_at,view_count,image_url,user_id,listing_images(image_url,sort_order)';
const SUMMARY_SELECT = 'category_id,subcategory_id,category,subcategory,category_label,brand,model,title';
const FEATURED_SELECT = ADVANCED_SELECT;

export const DEFAULT_LISTINGS_PAGE_SIZE = 12;
export const MAX_LISTINGS_PAGE_SIZE = 48;

function escapeFilterValue(value) {
  return String(value || '').replace(/[%,_()&|]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isMissingColumn(error) {
  return /column .* does not exist|schema cache|Could not find|PGRST204/i.test(error?.message || error?.details || '');
}

function isAllOption(value) {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  return !normalized || normalized === 'tumu' || normalized === 'tum' || normalized === 'all';
}

function normalizeFilterNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const match = String(value).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function applySort(request, sort = 'newest') {
  request = request.order('is_featured', { ascending: false });

  if (sort === 'price_low' || sort === 'price_asc') {
    return request.order('price', { ascending: true, nullsFirst: false });
  }

  if (sort === 'price_high' || sort === 'price_desc') {
    return request.order('price', { ascending: false, nullsFirst: false });
  }

  if (sort === 'popular') {
    return request.order('view_count', { ascending: false });
  }

  if (sort === 'featured') {
    request = request.eq('is_featured', true);
    return request
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
  }

  return request.order('created_at', { ascending: false });
}

export function applyCategoryFilter(request, categoryId) {
  if (!categoryId) return request;

  const ids = getDescendantCategoryIds(categoryId);
  if (!ids.length) return request;

  const inList = ids.join(',');
  return request.or(`category_id.in.(${inList}),subcategory_id.in.(${inList})`);
}

export function applyAdvancedFilters(request, advancedFilters = {}) {
  const entries = Object.entries(advancedFilters || {}).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');
  if (!entries.length) return request;

  for (const [key, rawValue] of entries) {
    if (key.endsWith('Min') || key.endsWith('Max')) {
      const baseKey = key.replace(/(Min|Max)$/, '');
      const filterValue = normalizeFilterNumber(rawValue);
      if (filterValue === null) continue;
      const column = `attributes->>${baseKey}`;
      request = key.endsWith('Min')
        ? request.gte(column, String(filterValue))
        : request.lte(column, String(filterValue));
      continue;
    }

    const escaped = escapeFilterValue(rawValue);
    if (escaped) request = request.eq(`attributes->>${key}`, escaped);
  }

  return request;
}

function applyFilters(request, {
  query = '',
  location = 'Tumu',
  minPrice = '',
  maxPrice = '',
  includePending = false,
} = {}) {
  if (!includePending) request = request.in('status', PUBLIC_LISTING_STATUSES);

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

  if (!isAllOption(location)) {
    const cleanLocation = String(location || '').trim();
    if (cleanLocation) request = request.eq('location', cleanLocation);
  }

  const min = Number(String(minPrice).replace(/\D/g, ''));
  const max = Number(String(maxPrice).replace(/\D/g, ''));
  if (minPrice !== '' && Number.isFinite(min)) request = request.gte('price', min);
  if (maxPrice !== '' && Number.isFinite(max)) request = request.lte('price', max);

  return request;
}

export function applyListingFilters(request, filters = {}) {
  request = applyFilters(request, filters);
  request = applyCategoryFilter(request, filters.categoryId);
  request = applyAdvancedFilters(request, filters.advancedFilters);
  return applySort(request, filters.sort || 'newest');
}

function resolvePagination(filters = {}) {
  const pageSize = Math.min(
    Math.max(1, Number(filters.pageSize || filters.limit || DEFAULT_LISTINGS_PAGE_SIZE)),
    MAX_LISTINGS_PAGE_SIZE
  );
  const page = Math.max(1, Number(filters.page || 1));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return { page, pageSize, from, to };
}

export function buildSearchQuery(filters = {}, selectColumns = ADVANCED_SELECT, options = {}) {
  assertPublicSupabaseConfig();
  const { page, pageSize, from, to } = resolvePagination(filters);
  const countOption = options.count ? { count: 'exact' } : undefined;

  let request = supabase.from('listings').select(selectColumns, countOption);
  request = applyListingFilters(request, filters);
  return request.range(from, to);
}

export async function searchListings(filters = {}) {
  assertPublicSupabaseConfig();
  const { page, pageSize } = resolvePagination(filters);

  let { data, error, count } = await buildSearchQuery(filters, ADVANCED_SELECT, { count: true });

  if (error && isMissingColumn(error)) {
    console.warn('searchListings basic select fallback:', error.message || error);
    ({ data, error, count } = await buildSearchQuery(filters, BASIC_SELECT, { count: true }));
  }

  if (error) {
    throw new Error(error.message || 'İlanlar yüklenemedi.');
  }

  const rows = data || [];
  const total = Number.isFinite(count) ? count : rows.length;

  return {
    data: rows,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

export async function fetchFeaturedListings(limit = 8) {
  assertPublicSupabaseConfig();
  const pageSize = Math.min(Math.max(1, Number(limit || 8)), MAX_LISTINGS_PAGE_SIZE);
  const now = new Date().toISOString();

  let { data, error } = await supabase
    .from('listings')
    .select(FEATURED_SELECT)
    .in('status', PUBLIC_LISTING_STATUSES)
    .eq('is_featured', true)
    .or(`featured_until.is.null,featured_until.gt.${now}`)
    .order('featured_until', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(pageSize);

  if (error && isMissingColumn(error)) {
    ({ data, error } = await supabase
      .from('listings')
      .select(BASIC_SELECT)
      .in('status', PUBLIC_LISTING_STATUSES)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(pageSize));
  }

  if (error) {
    throw new Error(error.message || 'Öne çıkan ilanlar yüklenemedi.');
  }

  return (data || []).filter((row) => {
    if (!row?.is_featured) return false;
    if (!row.featured_until) return true;
    return new Date(row.featured_until).getTime() > Date.now();
  });
}

export async function fetchApprovedListingSummaries() {
  assertPublicSupabaseConfig();

  let { data, error } = await supabase
    .from('listings')
    .select(SUMMARY_SELECT)
    .in('status', PUBLIC_LISTING_STATUSES)
    .limit(5000);

  if (error && isMissingColumn(error)) {
    ({ data, error } = await supabase
      .from('listings')
      .select('category,subcategory,title')
      .in('status', PUBLIC_LISTING_STATUSES)
      .limit(5000));
  }

  if (error) {
    throw new Error(error.message || 'Kategori sayıları yüklenemedi.');
  }

  return data || [];
}
