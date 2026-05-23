import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const listingSelect = '*, listing_images(image_url, sort_order)';

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function applySort(query, sort) {
  query = query.order('is_featured', { ascending: false });

  if (sort === 'price_low' || sort === 'price_asc') {
    return query.order('price', { ascending: true, nullsFirst: false });
  }

  if (sort === 'price_high' || sort === 'price_desc') {
    return query.order('price', { ascending: false, nullsFirst: false });
  }

  if (sort === 'popular') {
    return query.order('view_count', { ascending: false, nullsFirst: false });
  }

  return query
    .order('featured_until', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
}

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryText = (searchParams.get('query') || '').trim();
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const minPrice = parseNumber(searchParams.get('minPrice'));
    const maxPrice = parseNumber(searchParams.get('maxPrice'));
    const sort = searchParams.get('sort') || 'newest';

    let query = supabase
      .from('listings')
      .select(listingSelect)
      .eq('status', 'approved');

    if (queryText) {
      const escaped = queryText.replaceAll(',', ' ').replaceAll('%', '').replaceAll('*', '');
      query = query.or([
        `title.ilike.%${escaped}%`,
        `description.ilike.%${escaped}%`,
        `category.ilike.%${escaped}%`,
        `subcategory.ilike.%${escaped}%`,
        `location.ilike.%${escaped}%`,
        `seller_name.ilike.%${escaped}%`,
      ].join(','));
    }

    if (category && category !== 'Tümü') query = query.eq('category', category);
    if (location && location !== 'Tümü') query = query.eq('location', location);
    if (minPrice !== null) query = query.gte('price', minPrice);
    if (maxPrice !== null) query = query.lte('price', maxPrice);

    const { data, error } = await applySort(query, sort).limit(120);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { data: data || [] },
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
