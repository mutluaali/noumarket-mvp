export const SUSPENSION_BLOCK_MESSAGE = 'Hesabın askıya alındı. Destek ile iletişime geç.';

export function isUserSuspended(profile) {
  return Boolean(profile?.is_suspended);
}

export function evaluateSuspensionPermission(actorProfile, targetProfile) {
  if (!actorProfile?.id || !targetProfile?.id) {
    return { allowed: false, error: 'Kullanıcı bulunamadı.' };
  }

  if (actorProfile.id === targetProfile.id) {
    return { allowed: false, error: 'Kendi hesabını askıya alamazsın.' };
  }

  if (!['admin', 'moderator'].includes(String(actorProfile.role || ''))) {
    return { allowed: false, error: 'Yönetim paneline erişim yetkin yok.' };
  }

  if (targetProfile.role === 'admin') {
    return { allowed: false, error: 'Yönetim hesapları askıya alınamaz.' };
  }

  if (actorProfile.role === 'moderator') {
    if (targetProfile.role === 'moderator') {
      return { allowed: false, error: 'Moderatör başka moderatörü askıya alamaz.' };
    }
    if (targetProfile.role !== 'user') {
      return { allowed: false, error: 'Bu hesap askıya alınamaz.' };
    }
  }

  return { allowed: true };
}

export async function fetchUserSuspensionState(client, userId) {
  if (!client || !userId) return null;

  let { data, error } = await client
    .from('profiles')
    .select('id, role, is_suspended, suspended_at')
    .eq('id', userId)
    .maybeSingle();

  if (error && /column .* does not exist|Could not find|PGRST204/i.test(error.message || '')) {
    return { id: userId, role: 'user', is_suspended: false };
  }

  if (error) throw error;
  return data;
}

export async function assertUserNotSuspended(client, userId) {
  const profile = await fetchUserSuspensionState(client, userId);
  if (isUserSuspended(profile)) {
    const error = new Error(SUSPENSION_BLOCK_MESSAGE);
    error.code = 'USER_SUSPENDED';
    throw error;
  }
  return profile;
}

export function createSuspensionError() {
  const error = new Error(SUSPENSION_BLOCK_MESSAGE);
  error.code = 'USER_SUSPENDED';
  return error;
}

export function isSuspensionError(error) {
  return error?.code === 'USER_SUSPENDED';
}

export async function ensureUserCanTransact(client, userId) {
  return assertUserNotSuspended(client, userId);
}
