import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'build-placeholder-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function isAuthorized(request) {
  const cronSecret = process.env.CRON_SECRET;

  // Lokal geliştirmede CRON_SECRET zorunlu olmasın.
  if (!cronSecret && process.env.NODE_ENV !== 'production') {
    return true;
  }

  // Production'da CRON_SECRET varsa Authorization header kontrol edilir.
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    return authHeader === `Bearer ${cronSecret}`;
  }

  // Vercel Cron çağrıları için fallback.
  const userAgent = request.headers.get('user-agent') || '';
  return userAgent.includes('vercel-cron');
}

export async function GET(request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL eksik.' },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY eksik.' },
        { status: 500 }
      );
    }

    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Yetkisiz istek.' },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update({
        is_premium: false,
        is_featured: false,
      })
      .lt('premium_until', now)
      .or('is_premium.eq.true,is_featured.eq.true')
      .select('id, title, premium_until, is_premium, is_featured');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      checkedAt: now,
      expiredCount: data?.length || 0,
      expiredListings: data || [],
    });
  } catch (error) {
    console.error('expire-premiums error:', error);
    return NextResponse.json(
      { error: error.message || 'Premium süre kontrolü başarısız.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  return GET(request);
}
