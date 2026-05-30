import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { analyzeListingSafety } from '@/lib/moderation';

async function requireAdmin(request, supabase) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) throw new Error('Oturum bulunamadı.');

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user?.id) throw new Error('Oturum doğrulanamadı.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') throw new Error('Bu işlem için admin yetkisi gerekir.');
  return userData.user;
}

export async function GET(request) {
  try {
    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabase = createServiceRoleClient();
    await requireAdmin(request, supabase);

    const { data: listings, error } = await supabase
      .from('listings')
      .select('id,title,description,category,location,price,status,created_at,seller_phone,metadata')
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(120);

    if (error) throw error;

    const analyzed = (listings || []).map((item) => {
      const result = analyzeListingSafety(item);
      const savedScore = item.metadata?.moderation_risk_score;
      const savedLevel = item.metadata?.moderation_risk_level;
      const savedReasons = item.metadata?.moderation_risk_reasons;
      return {
        ...item,
        risk_score: typeof savedScore === 'number' ? savedScore : result.riskScore,
        risk_level: savedLevel || result.level,
        risk_reasons: Array.isArray(savedReasons) ? savedReasons : result.reasons,
      };
    }).filter((item) => item.risk_score >= 20 || item.status === 'pending')
      .sort((a, b) => Number(b.risk_score || 0) - Number(a.risk_score || 0));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayActions } = await supabase
      .from('moderation_actions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    return NextResponse.json({
      items: analyzed,
      stats: {
        totalQueue: analyzed.length,
        highRisk: analyzed.filter((x) => x.risk_level === 'high').length,
        mediumRisk: analyzed.filter((x) => x.risk_level === 'medium').length,
        todayActions: todayActions || 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Moderasyon verileri alınamadı.' }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabase = createServiceRoleClient();
    const admin = await requireAdmin(request, supabase);
    const body = await request.json();
    const listingId = body.listingId;
    const action = body.action;
    if (!listingId || !['approve', 'review', 'block'].includes(action)) throw new Error('Geçersiz moderasyon işlemi.');

    const nextStatus = action === 'approve' ? 'approved' : action === 'block' ? 'rejected' : 'pending';
    const moderationStatus = action === 'approve' ? 'approved' : action === 'block' ? 'blocked' : 'review';

    const { data: listing, error: readError } = await supabase
      .from('listings')
      .select('metadata')
      .eq('id', listingId)
      .single();
    if (readError) throw readError;

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
        metadata: {
          ...(listing?.metadata || {}),
          moderation_status: moderationStatus,
          moderation_action_at: new Date().toISOString(),
        },
      })
      .eq('id', listingId);

    if (updateError) throw updateError;

    await supabase.from('moderation_actions').insert({
      admin_id: admin.id,
      listing_id: listingId,
      action,
      reason: 'manual_quality_review',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Moderasyon işlemi yapılamadı.' }, { status: 400 });
  }
}
