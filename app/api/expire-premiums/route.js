import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';

function isAuthorized(request) {
  const cronSecret = String(process.env.CRON_SECRET || '').trim();

  if (!cronSecret && process.env.NODE_ENV !== 'production') {
    return true;
  }

  if (cronSecret) {
    const authHeader = String(request.headers.get('authorization') || '').trim();
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : authHeader;
    return token === cronSecret;
  }

  const userAgent = request.headers.get('user-agent') || '';
  return userAgent.includes('vercel-cron');
}

export async function GET(request) {
  try {
    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Yetkisiz istek.' }, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const now = new Date().toISOString();

    const { data: expiredListings, error } = await supabaseAdmin
      .from('listings')
      .update({
        is_premium: false,
        is_featured: false,
        premium_until: null,
        featured_until: null,
        updated_at: now,
      })
      .or(`and(is_featured.eq.true,featured_until.lt.${now}),and(is_premium.eq.true,premium_until.lt.${now})`)
      .select('id, title, premium_until, featured_until, is_premium, is_featured');

    if (error) {
      throw error;
    }

    const { data: expiredSellers, error: sellerError } = await supabaseAdmin
      .from('profiles')
      .update({
        account_plan: 'free',
        premium_status: 'inactive',
        listing_photo_limit: 5,
        can_add_video: false,
        has_storefront: false,
        boost_discount_percent: 0,
        updated_at: now,
      })
      .eq('account_plan', 'premium_seller')
      .eq('premium_status', 'active')
      .lt('premium_ends_at', now)
      .select('id, premium_ends_at');

    if (sellerError && !/column|schema cache|Could not find/i.test(sellerError.message || '')) {
      throw sellerError;
    }

    return NextResponse.json({
      success: true,
      checkedAt: now,
      expiredCount: expiredListings?.length || 0,
      expiredListings: expiredListings || [],
      expiredPremiumSellers: expiredSellers || [],
    });
  } catch (error) {
    console.error('expire-premiums error:', error);
    return NextResponse.json({ error: error.message || 'Premium süre kontrolü başarısız.' }, { status: 500 });
  }
}

export async function POST(request) {
  return GET(request);
}
