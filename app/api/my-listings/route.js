import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';


function getAccessToken(request) {
  const authHeader = request.headers.get('authorization') || '';

  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookieHeader = request.headers.get('cookie') || '';

  const match = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);

  if (!match) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(match[1]);
    const parsed = JSON.parse(decoded);

    return (
      parsed?.access_token ||
      parsed?.currentSession?.access_token ||
      parsed?.session?.access_token ||
      null
    );
  } catch (error) {
    console.error('auth cookie parse error:', error);
    return null;
  }
}

function isMissingColumn(error) {
  return /column .* does not exist|schema cache|Could not find|PGRST204/i.test(error?.message || error?.details || '');
}

function withTimeout(promise, timeoutMs, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function GET(request) {
  try {
    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabaseAdmin = createServiceRoleClient();
    const token = getAccessToken(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Oturum token bulunamadı. Çıkış yapıp tekrar giriş yap.' },
        { status: 401 }
      );
    }

    const { data: authData, error: authError } = await withTimeout(
      supabaseAdmin.auth.getUser(token),
      3500,
      'Oturum dogrulama zaman asimina ugradi.'
    );

    if (authError || !authData?.user?.id) {
      return NextResponse.json(
        { error: 'Oturum doğrulanamadı. Çıkış yapıp tekrar giriş yap.' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    const listingSelect = [
      'id',
      'user_id',
      'title',
      'description',
      'category',
      'subcategory',
      'category_id',
      'subcategory_id',
      'price',
      'currency',
      'location',
      'seller_name',
      'seller_phone',
      'seller_email',
      'image_url',
      'status',
      'approval_status',
      'approved_at',
      'rejected_reason',
      'is_featured',
      'featured_until',
      'view_count',
      'created_at',
      'updated_at',
      'metadata',
      'attributes',
    ].join(',');

    let { data: listings, error: listingsError } = await withTimeout(
      supabaseAdmin
        .from('listings')
        .select(listingSelect)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(80),
      4500,
      'Ilanlar sorgusu zaman asimina ugradi.'
    );

    if (listingsError && isMissingColumn(listingsError)) {
      ({ data: listings, error: listingsError } = await withTimeout(
        supabaseAdmin
          .from('listings')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(80),
        4500,
        'Ilanlar sorgusu zaman asimina ugradi.'
      ));
    }

    if (listingsError) {
      throw listingsError;
    }

    const listingRows = listings || [];
    const listingIds = listingRows.map((item) => item.id).filter(Boolean);

    const imagesByListingId = {};

    if (listingIds.length > 0) {
      const { data: images, error: imagesError } = await withTimeout(
        supabaseAdmin
          .from('listing_images')
          .select('listing_id, image_url, sort_order')
          .in('listing_id', listingIds)
          .order('sort_order', { ascending: true }),
        3500,
        'Ilan fotograf sorgusu zaman asimina ugradi.'
      ).catch((error) => {
        console.warn('listing_images query timeout:', error.message);
        return { data: [], error: null };
      });

      if (imagesError) {
        console.warn('listing_images query error:', imagesError.message);
      }

      for (const image of images || []) {
        if (!imagesByListingId[image.listing_id]) {
          imagesByListingId[image.listing_id] = [];
        }

        imagesByListingId[image.listing_id].push({
          image_url: image.image_url,
          sort_order: image.sort_order,
        });
      }
    }

    const data = listingRows.map((listing) => ({
      ...listing,
      listing_images: imagesByListingId[listing.id] || [],
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('api/my-listings error:', error);
    return NextResponse.json(
      { error: error.message || 'İlanlar yüklenemedi.' },
      { status: 500 }
    );
  }
}
