import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder-service-role-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function getAccessToken(request) {
  const authHeader = request.headers.get('authorization') || '';

  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);

  if (!match) return null;

  try {
    const decoded = decodeURIComponent(match[1]);
    const parsed = JSON.parse(decoded);

    return (
      parsed?.access_token ||
      parsed?.currentSession?.access_token ||
      parsed?.session?.access_token ||
      null
    );
  } catch {
    return null;
  }
}

async function getUserFromRequest(request, supabaseAdmin) {
  const token = getAccessToken(request);

  if (!token) {
    return { user: null, error: 'Oturum token bulunamadı. Çıkış yapıp tekrar giriş yap.' };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user?.id) {
    return { user: null, error: 'Oturum doğrulanamadı. Çıkış yapıp tekrar giriş yap.' };
  }

  return { user: data.user, error: null };
}


export async function GET(request) {
  try {
    const supabaseAdmin = makeAdminClient();
    const { user, error: userError } = await getUserFromRequest(request, supabaseAdmin);

    if (userError) {
      return NextResponse.json({ error: userError }, { status: 401 });
    }

    const { data: favoriteRows, error: favoritesError } = await supabaseAdmin
      .from('favorites')
      .select('id, listing_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (favoritesError) throw favoritesError;

    const rows = favoriteRows || [];
    const listingIds = rows.map((row) => row.listing_id).filter(Boolean);

    if (listingIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .in('id', listingIds);

    if (listingsError) throw listingsError;

    const listingsById = {};

    for (const listing of listings || []) {
      listingsById[listing.id] = listing;
    }

    const { data: images, error: imagesError } = await supabaseAdmin
      .from('listing_images')
      .select('listing_id, image_url, sort_order')
      .in('listing_id', listingIds)
      .order('sort_order', { ascending: true });

    const imagesByListingId = {};

    if (!imagesError) {
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

    const data = rows
      .map((row) => {
        const listing = listingsById[row.listing_id];

        if (!listing) return null;

        return {
          ...listing,
          favorite_id: row.id,
          favorited_at: row.created_at,
          listing_images: imagesByListingId[listing.id] || [],
        };
      })
      .filter(Boolean);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('api/favorites error:', error);
    return NextResponse.json(
      { error: error.message || 'Favoriler yüklenemedi.' },
      { status: 500 }
    );
  }
}
