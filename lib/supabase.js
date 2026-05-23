import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabase = Boolean(url && anon);

export const supabase = hasSupabase
  ? createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'noumarket-auth-token',
      },
      global: {
        headers: {
          'x-application-name': 'noumarket',
        },
      },
    })
  : null;

export async function getStableSession(retries = 4) {
  if (!hasSupabase || !supabase) return null;

  for (let i = 0; i < retries; i += 1) {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data?.session) return data.session;
    await new Promise((resolve) => setTimeout(resolve, 180 + i * 120));
  }

  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    const sessionResult = await supabase.auth.getSession();
    return sessionResult.data?.session || { user: data.user };
  }

  return null;
}
