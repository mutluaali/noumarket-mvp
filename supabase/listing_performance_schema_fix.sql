-- NouMarket targeted performance/schema fix
-- Supabase SQL Editor'da bir kez çalıştır.

-- İlan arama ve listeleme hızlandırma
create index if not exists listings_status_created_at_idx on public.listings(status, created_at desc);
create index if not exists listings_status_featured_idx on public.listings(status, is_featured desc, created_at desc);
create index if not exists listings_category_idx on public.listings(category);
create index if not exists listings_subcategory_idx on public.listings(subcategory);
create index if not exists listings_location_idx on public.listings(location);
create index if not exists listings_price_idx on public.listings(price);

-- Bildirim sayısı / modal hızlandırma
create index if not exists notifications_user_read_created_idx on public.notifications(user_id, is_read, created_at desc);
create index if not exists notifications_user_id_idx on public.notifications(user_id);

-- Eğer eski tablolarda yeni alanlar yoksa opsiyonel ekle. Hata verirse tablo adını kontrol et.
alter table public.listings add column if not exists category_id text;
alter table public.listings add column if not exists subcategory_id text;
alter table public.listings add column if not exists attributes jsonb default '{}'::jsonb;
alter table public.listings add column if not exists contact_methods text[] default array['message'];

-- Not: brand kolonu zorunlu değil; yeni kod brand olmadan da kayıt atar.
