import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { seedListings } from '@/lib/seedListings';


function getAccessToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) return authHeader.slice(7).trim();
  return null;
}

async function requireAdmin(request, supabaseAdmin) {
  const token = getAccessToken(request);
  if (!token) throw new Error('Yönetim oturumu bulunamadı.');
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user?.id) throw new Error('Yönetim oturumu doğrulanamadı.');

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!['admin', 'moderator'].includes(profile?.role)) throw new Error('Yönetim paneline erişim yetkin yok.');
  return authData.user;
}

function withDates(item, index) {
  const createdAt = new Date(Date.now() - index * 11 * 60 * 60 * 1000).toISOString();
  const featuredUntil = item.is_featured
    ? new Date(Date.now() + (10 + index) * 24 * 60 * 60 * 1000).toISOString()
    : null;

  return {
    title: item.title,
    description: item.description,
    category: item.category,
    subcategory: item.subcategory,
    price: item.price,
    currency: 'XPF',
    location: item.location,
    condition: item.condition || 'used',
    seller_name: item.seller_name,
    seller_phone: item.seller_phone,
    seller_email: item.seller_email,
    image_url: item.image_url,
    status: 'approved',
    is_featured: Boolean(item.is_featured),
    featured_until: featuredUntil,
    view_count: Number(item.view_count || 0),
    metadata: {
      ...(item.metadata || {}),
      seed: true,
      seed_version: 'v18',
    },
    created_at: createdAt,
    updated_at: createdAt,
  };
}

export async function GET(request) {
  try {
    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabaseAdmin = createServiceRoleClient();
    await requireAdmin(request, supabaseAdmin);

    const { count, error } = await supabaseAdmin
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('metadata->>seed', 'true');

    if (error) throw error;

    return NextResponse.json({ seedCount: count || 0, available: seedListings.length });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Seed durumu alınamadı.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabaseAdmin = createServiceRoleClient();
    await requireAdmin(request, supabaseAdmin);

    const body = await request.json().catch(() => ({}));
    const mode = body.mode || 'insert_missing';

    if (mode === 'reset') {
      const { error: deleteError } = await supabaseAdmin
        .from('listings')
        .delete()
        .eq('metadata->>seed', 'true');
      if (deleteError) throw deleteError;
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('listings')
      .select('title')
      .eq('metadata->>seed', 'true');

    if (existingError) throw existingError;
    const existingTitles = new Set((existing || []).map((item) => item.title));

    const rows = seedListings
      .filter((item) => mode === 'reset' || !existingTitles.has(item.title))
      .map(withDates);

    if (!rows.length) {
      return NextResponse.json({ inserted: 0, message: 'Seed ilanlar zaten mevcut.' });
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('listings')
      .insert(rows)
      .select('id, title, image_url');

    if (insertError) throw insertError;

    const imageRows = (inserted || [])
      .filter((item) => item.image_url)
      .map((item) => ({ listing_id: item.id, image_url: item.image_url, sort_order: 0 }));

    if (imageRows.length) {
      const { error: imageError } = await supabaseAdmin.from('listing_images').insert(imageRows);
      if (imageError) console.warn('Seed listing_images insert warning:', imageError.message);
    }

    return NextResponse.json({ inserted: inserted?.length || 0, listings: inserted || [] });
  } catch (error) {
    console.error('api/admin/seed error:', error);
    return NextResponse.json({ error: error.message || 'Seed ilanlar oluşturulamadı.' }, { status: 500 });
  }
}
