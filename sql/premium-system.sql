-- NouMarket premium listing system
-- Run in Supabase SQL Editor.

alter table listings
add column if not exists featured_until timestamptz;

create index if not exists listings_premium_sort_idx
on listings (status, is_featured desc, featured_until desc, created_at desc);

-- Optional helper function: expire old premium listings manually.
create or replace function expire_old_premium_listings()
returns void
language sql
security definer
as $$
  update listings
  set is_featured = false,
      featured_until = null,
      updated_at = now()
  where is_featured = true
    and featured_until is not null
    and featured_until < now();
$$;

-- Optional RPC policy may be added later with stricter admin role checks.
