import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { sanitizePublicListing } from '@/lib/listings';

const listingSelect =
  'id,user_id,title,description,category,subcategory,category_id,subcategory_id,condition,price,currency,location,seller_name,seller_phone,image_url,status,is_featured,featured_until,view_count,created_at,metadata,attributes,listing_images(image_url, sort_order)';

export async function GET(_request, context) {
  try {
    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabase = createServiceRoleClient();
    const params = await context.params;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: 'İlan ID gerekli.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('listings')
      .select(listingSelect)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 });
    }

    if (data.status !== 'approved') {
      return NextResponse.json({ error: 'Bu ilan yayında değil.' }, { status: 403 });
    }

    const nextViewCount = Number(data.view_count || 0) + 1;

    supabase
      .from('listings')
      .update({ view_count: nextViewCount })
      .eq('id', id)
      .then(({ error: viewError }) => {
        if (viewError) console.warn('view_count artırılamadı:', viewError.message);
      });

    return NextResponse.json(
      { data: sanitizePublicListing({ ...data, view_count: nextViewCount }) },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'İlan detayı alınamadı.' },
      { status: 500 }
    );
  }
}
