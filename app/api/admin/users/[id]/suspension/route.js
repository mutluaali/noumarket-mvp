import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { requireAdmin } from '@/lib/adminAuth';
import { evaluateSuspensionPermission } from '@/lib/suspension';

function isMissingSuspensionColumn(error) {
  return /column .* does not exist|Could not find|PGRST204/i.test(error?.message || error?.details || '');
}

export async function PATCH(request, context) {
  try {
    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabaseAdmin = createServiceRoleClient();
    const auth = await requireAdmin(request, supabaseAdmin);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: targetUserId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const action = body.action === 'unsuspend' ? 'unsuspend' : 'suspend';
    const reason = String(body.reason || '').trim();

    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name, store_name, is_suspended')
      .eq('id', targetUserId)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!targetProfile) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    const permission = evaluateSuspensionPermission(auth.profile, targetProfile);
    if (!permission.allowed) {
      return NextResponse.json({ error: permission.error }, { status: 403 });
    }

    const patch = action === 'suspend'
      ? {
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          suspended_by: auth.user.id,
          suspension_reason: reason || 'Moderasyon tarafından askıya alındı.',
          updated_at: new Date().toISOString(),
        }
      : {
          is_suspended: false,
          suspended_at: null,
          suspended_by: null,
          suspension_reason: null,
          updated_at: new Date().toISOString(),
        };

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(patch)
      .eq('id', targetUserId)
      .select('id, role, is_suspended, suspended_at, suspension_reason')
      .maybeSingle();

    if (error && isMissingSuspensionColumn(error)) {
      return NextResponse.json(
        { error: 'Askıya alma kolonları henüz uygulanmamış. sql/2026-05-30-user-suspension.sql dosyasını çalıştır.' },
        { status: 500 }
      );
    }

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('api/admin/users/[id]/suspension PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Askıya alma işlemi başarısız.' }, { status: 500 });
  }
}
