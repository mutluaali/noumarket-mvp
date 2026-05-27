import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


function makeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL eksik.');
  }

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY eksik.');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

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

export async function GET(request) {
  try {
    const supabaseAdmin = makeAdminClient();
    const token = getAccessToken(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Oturum token bulunamadı. Çıkış yapıp tekrar giriş yap.' },
        { status: 401 }
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

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
      'is_featured',
      'featured_until',
      'view_count',
      'created_at',
      'updated_at',
      'metadata',
      'attributes',
    ].join(',');

    let { data: listings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select(listingSelect)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80);

    if (listingsError && isMissingColumn(listingsError)) {
      ({ data: listings, error: listingsError } = await supabaseAdmin
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(80));
    }

    if (listingsError) {
      throw listingsError;
    }

    const listingRows = listings || [];
    const listingIds = listingRows.map((item) => item.id).filter(Boolean);

    const imagesByListingId = {};
    const favoriteCountByListingId = {};
    const conversationCountByListingId = {};

    if (listingIds.length > 0) {
      const imagesRequest = supabaseAdmin
        .from('listing_images')
        .select('listing_id, image_url, sort_order')
        .in('listing_id', listingIds)
        .order('sort_order', { ascending: true });

      const favoritesRequest = supabaseAdmin
        .from('favorites')
        .select('listing_id')
        .in('listing_id', listingIds);

      const conversationsRequest = supabaseAdmin
        .from('conversations')
        .select('id, listing_id')
        .in('listing_id', listingIds);

      const [
        { data: images, error: imagesError },
        { data: favorites, error: favoritesError },
        { data: conversations, error: conversationsError },
      ] = await Promise.all([imagesRequest, favoritesRequest, conversationsRequest]);

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

      if (favoritesError) {
        console.warn('favorites count query error:', favoritesError.message);
      }

      for (const row of favorites || []) {
        favoriteCountByListingId[row.listing_id] = (favoriteCountByListingId[row.listing_id] || 0) + 1;
      }

      if (conversationsError) {
        console.warn('conversations count query error:', conversationsError.message);
      }

      for (const row of conversations || []) {
        conversationCountByListingId[row.listing_id] = (conversationCountByListingId[row.listing_id] || 0) + 1;
      }
    }

    const data = listingRows.map((listing) => ({
      ...listing,
      listing_images: imagesByListingId[listing.id] || [],
      favorite_count: favoriteCountByListingId[listing.id] || 0,
      conversation_count: conversationCountByListingId[listing.id] || 0,
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
