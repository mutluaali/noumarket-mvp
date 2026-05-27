-- NouMarket targeted performance + schema support
-- Supabase SQL Editor'da bir kez çalıştır.

alter table if exists public.listings add column if not exists category_id text;
alter table if exists public.listings add column if not exists subcategory_id text;
alter table if exists public.listings add column if not exists category_label text;
alter table if exists public.listings add column if not exists brand text;
alter table if exists public.listings add column if not exists model text;
alter table if exists public.listings add column if not exists attributes jsonb default '{}'::jsonb;
alter table if exists public.listings add column if not exists contact_methods text[] default array[]::text[];
alter table if exists public.listings add column if not exists currency text default 'XPF';

create index if not exists listings_status_created_idx on public.listings(status, created_at desc);
create index if not exists listings_status_featured_created_idx on public.listings(status, is_featured, created_at desc);
create index if not exists listings_category_id_idx on public.listings(category_id);
create index if not exists listings_subcategory_id_idx on public.listings(subcategory_id);
create index if not exists listings_category_idx on public.listings(category);
create index if not exists listings_subcategory_idx on public.listings(subcategory);
create index if not exists listings_brand_idx on public.listings(brand);
create index if not exists listings_model_idx on public.listings(model);
create index if not exists listings_price_idx on public.listings(price);
create index if not exists listings_location_idx on public.listings(location);

create extension if not exists pg_trgm;
create index if not exists listings_title_trgm_idx on public.listings using gin (title gin_trgm_ops);
create index if not exists listings_description_trgm_idx on public.listings using gin (description gin_trgm_ops);

create index if not exists notifications_user_read_created_idx on public.notifications(user_id, is_read, created_at desc);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at desc);
