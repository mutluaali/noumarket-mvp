import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { applyListingFilters, DEFAULT_LISTINGS_PAGE_SIZE, MAX_LISTINGS_PAGE_SIZE } from '@/lib/search';

const listingSelect = 'id,user_id,title,description,category,subcategory,category_id,subcategory_id,condition,price,currency,location,seller_name,seller_phone,seller_email,image_url,status,is_featured,featured_until,view_count,created_at,metadata,attributes,listing_images(image_url, sort_order)';

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAdvancedFilters(searchParams) {
  const raw = searchParams.get('advancedFilters');
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function GET(request) {
  try {
    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabase = createServiceRoleClient();
    const searchParams = request.nextUrl.searchParams;
    const pageSize = Math.min(
      Math.max(1, Number(searchParams.get('pageSize') || searchParams.get('limit') || DEFAULT_LISTINGS_PAGE_SIZE)),
      MAX_LISTINGS_PAGE_SIZE
    );
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const filters = {
      query: (searchParams.get('query') || '').trim(),
      categoryId: searchParams.get('categoryId') || searchParams.get('category_id') || null,
      location: searchParams.get('location') || 'Tumu',
      minPrice: searchParams.get('minPrice') ?? searchParams.get('min') ?? '',
      maxPrice: searchParams.get('maxPrice') ?? searchParams.get('max') ?? '',
      sort: searchParams.get('sort') || 'newest',
      advancedFilters: parseAdvancedFilters(searchParams),
    };

    if (filters.minPrice === '' && searchParams.get('minPrice') === null && searchParams.get('min') !== null) {
      const min = parseNumber(searchParams.get('min'));
      if (min !== null) filters.minPrice = String(min);
    }
    if (filters.maxPrice === '' && searchParams.get('maxPrice') === null && searchParams.get('max') !== null) {
      const max = parseNumber(searchParams.get('max'));
      if (max !== null) filters.maxPrice = String(max);
    }

    let query = supabase.from('listings').select(listingSelect, { count: 'exact' });
    query = applyListingFilters(query, filters);
    const { data, error, count } = await query.range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total = Number.isFinite(count) ? count : (data || []).length;

    return NextResponse.json(
      {
        data: data || [],
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'İlanlar alınamadı' },
      { status: 500 }
    );
  }
}
