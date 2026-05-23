import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

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

export async function GET(_request, context) {
  try {
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
      { data: { ...data, view_count: nextViewCount } },
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
