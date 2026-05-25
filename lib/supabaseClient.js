// Compatibility wrapper for components importing '@/lib/supabaseClient'
// Keep this file so older/newer components can share the same Supabase client.

export { supabase } from './supabase'
export { supabase as default } from './supabase'
