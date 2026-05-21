-- Search performance indexes for NouMarket.
-- Run this in Supabase SQL Editor.

create extension if not exists pg_trgm;

create index if not exists listings_status_idx
on listings(status);

create index if not exists listings_category_idx
on listings(category);

create index if not exists listings_location_idx
on listings(location);

create index if not exists listings_price_idx
on listings(price);

create index if not exists listings_created_at_idx
on listings(created_at desc);

create index if not exists listings_featured_idx
on listings(is_featured desc);

create index if not exists listings_view_count_idx
on listings(view_count desc);

create index if not exists listings_title_trgm_idx
on listings using gin (title gin_trgm_ops);

create index if not exists listings_description_trgm_idx
on listings using gin (description gin_trgm_ops);

create index if not exists listings_location_trgm_idx
on listings using gin (location gin_trgm_ops);
