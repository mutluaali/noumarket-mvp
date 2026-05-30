import { NextResponse } from 'next/server';
import { createServiceRoleClient, getServiceRoleConfigError } from '@/lib/envGuards';
import { assertUserNotSuspended } from '@/lib/suspension';


function getAccessToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) return authHeader.slice(7).trim();
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token || null;
  } catch {
    return null;
  }
}

async function requireUser(request, supabaseAdmin) {
  const token = getAccessToken(request);
  if (!token) throw new Error('Oturum token bulunamadı. Çıkış yapıp tekrar giriş yap.');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) throw new Error('Oturum doğrulanamadı. Çıkış yapıp tekrar giriş yap.');
  return data.user;
}

async function assertOwner(supabaseAdmin, id, userId) {
  const { data, error } = await supabaseAdmin
    .from('listings')
    .select('id, user_id, status')
    .eq('id', id)
    .single();
  if (error || !data) throw new Error('İlan bulunamadı.');
  if (data.user_id !== userId) throw new Error('Bu ilanı değiştirme yetkin yok.');
  return data;
}

function isMissingColumn(error) {
  return /column .* does not exist|schema cache|Could not find|PGRST204/i.test(error?.message || error?.details || '');
}

export async function PATCH(request, context) {
  try {
    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabaseAdmin = createServiceRoleClient();
    const user = await requireUser(request, supabaseAdmin);
    await assertUserNotSuspended(supabaseAdmin, user.id);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    await assertOwner(supabaseAdmin, id, user.id);

    let patch = {};

    if (body.action === 'pause') {
      patch = { status: 'passive', updated_at: new Date().toISOString() };
    } else if (body.action === 'republish') {
      patch = {
        status: 'pending',
        approval_status: 'pending',
        approved_at: null,
        rejected_reason: null,
        updated_at: new Date().toISOString(),
      };
    } else if (body.action === 'mark_sold') {
      patch = { status: 'sold', updated_at: new Date().toISOString() };
    } else if (body.action === 'update') {
      patch = {
        title: body.title,
        description: body.description || '',
        category: body.category,
        subcategory: body.subcategory || null,
        condition: body.condition || 'used',
        price: body.price === '' || body.price === null || body.price === undefined ? null : Number(body.price),
        currency: body.currency || 'XPF',
        location: body.location,
        seller_name: body.seller_name || '',
        seller_phone: body.seller_phone || '',
        seller_email: body.seller_email || '',
        image_url: body.image_url || '',
        metadata: body.metadata || {},
        attributes: body.attributes || body.metadata || {},
        status: 'pending',
        approval_status: 'pending',
        approved_at: null,
        rejected_reason: null,
        updated_at: new Date().toISOString(),
      };
    } else {
      return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 });
    }

    let { error } = await supabaseAdmin
      .from('listings')
      .update(patch)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error && isMissingColumn(error)) {
      const fallbackPatch = { ...patch };
      delete fallbackPatch.approval_status;
      delete fallbackPatch.approved_at;
      delete fallbackPatch.rejected_reason;
      delete fallbackPatch.attributes;

      ({ error } = await supabaseAdmin
        .from('listings')
        .update(fallbackPatch)
        .eq('id', id)
        .eq('user_id', user.id));
    }

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('api/my-listings/[id] PATCH error:', error);
    return NextResponse.json({ error: error.message || 'İlan güncellenemedi.' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const configError = getServiceRoleConfigError();
    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: configError.status });
    }

    const supabaseAdmin = createServiceRoleClient();
    const user = await requireUser(request, supabaseAdmin);
    await assertUserNotSuspended(supabaseAdmin, user.id);
    const { id } = await context.params;
    await assertOwner(supabaseAdmin, id, user.id);

    const { error } = await supabaseAdmin
      .from('listings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('api/my-listings/[id] DELETE error:', error);
    return NextResponse.json({ error: error.message || 'İlan silinemedi.' }, { status: 500 });
  }
}
