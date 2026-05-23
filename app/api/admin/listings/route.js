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

const listingSelect = 'id,user_id,title,description,category,subcategory,condition,price,currency,location,seller_name,seller_phone,seller_email,image_url,status,is_featured,featured_until,view_count,created_at,updated_at,metadata,listing_images(image_url, sort_order)';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(listingSelect)
      .order('is_featured', { ascending: false })
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(100);

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
      { error: error.message || 'Admin ilanları alınamadı' },
      { status: 500 }
    );
  }
}
