-- Admin analytics performance indexes (idempotent, safe to run manually in Supabase SQL Editor)
-- Does NOT modify RLS policies or application logic.

create index if not exists idx_messages_created_at
  on public.messages (created_at desc);

create index if not exists idx_favorites_created_at
  on public.favorites (created_at desc);

create index if not exists idx_profiles_created_at
  on public.profiles (created_at desc);

create index if not exists idx_listings_status_created_at
  on public.listings (status, created_at desc);

create index if not exists idx_listings_approved_category
  on public.listings (category)
  where status = 'approved';

create index if not exists idx_listings_approved_location
  on public.listings (location)
  where status = 'approved';
