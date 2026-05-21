import { supabase } from './supabase';

export async function getCurrentProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export function userIsAdmin(profile) {
  return profile?.role === 'admin';
}
