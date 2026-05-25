-- NouMarket listing search/index fix
-- Supabase SQL Editor'da bir kez çalıştır.

alter table if exists public.listings add column if not exists category_id text;
alter table if exists public.listings add column if not exists subcategory_id text;
alter table if exists public.listings add column if not exists attributes jsonb default '{}'::jsonb;
alter table if exists public.listings add column if not exists contact_methods text[] default array[]::text[];
alter table if exists public.listings add column if not exists currency text default 'XPF';

create index if not exists listings_status_created_idx on public.listings(status, created_at desc);
create index if not exists listings_category_idx on public.listings(category);
create index if not exists listings_subcategory_idx on public.listings(subcategory);
create index if not exists listings_category_id_idx on public.listings(category_id);
create index if not exists listings_subcategory_id_idx on public.listings(subcategory_id);
create index if not exists listings_price_idx on public.listings(price);
create index if not exists listings_location_idx on public.listings(location);
create index if not exists listings_featured_created_idx on public.listings(is_featured, created_at desc);

create extension if not exists pg_trgm;
create index if not exists listings_title_trgm_idx on public.listings using gin (title gin_trgm_ops);
create index if not exists listings_description_trgm_idx on public.listings using gin (description gin_trgm_ops);
