-- NouMarket v4 core database schema
-- Supabase SQL Editor'da tek parça çalıştırılabilir.
-- Önce mevcut veritabanının yedeğini al. Bu dosya tablo yoksa oluşturur, kolon yoksa ekler.

create extension if not exists "pgcrypto";

-- 1) Kullanıcı profilleri
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin', 'moderator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Ana ilan tablosu
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  category text not null,
  subcategory text,
  price numeric default 0,
  currency text not null default 'XPF',
  location text,
  condition text default 'used',
  seller_name text,
  seller_phone text,
  seller_email text,
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'passive', 'sold')),
  is_featured boolean not null default false,
  featured_until timestamptz,
  view_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings add column if not exists subcategory text;
alter table public.listings add column if not exists condition text default 'used';
alter table public.listings add column if not exists currency text default 'XPF';
alter table public.listings add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.listings add column if not exists featured_until timestamptz;
alter table public.listings add column if not exists view_count integer default 0;
-- Admin moderation note visible to the seller when status = rejected.
alter table public.listings add column if not exists rejected_reason text;

-- 3) Çoklu ilan fotoğrafları
create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 4) Favoriler
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, listing_id)
);

-- 5) Mesajlaşma
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  buyer_id uuid references auth.users(id) on delete set null,
  seller_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(listing_id, buyer_id, seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6) Bildirimler
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'system',
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 7) Moderasyon kayıtları
create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);

-- 8) Ödeme kayıtları / Premium
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  listing_id uuid references public.listings(id) on delete cascade,
  provider text not null default 'stripe',
  provider_session_id text,
  provider_payment_id text,
  plan text,
  amount integer,
  currency text not null default 'XPF',
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- Performans indeksleri
create index if not exists idx_listings_status_created on public.listings(status, created_at desc);
create index if not exists idx_listings_category on public.listings(category);
create index if not exists idx_listings_location on public.listings(location);
create index if not exists idx_listings_featured on public.listings(is_featured, featured_until);
create index if not exists idx_listing_images_listing_id on public.listing_images(listing_id, sort_order);
create index if not exists idx_favorites_user_id on public.favorites(user_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id, created_at);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read, created_at desc);

-- RLS aktif et
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.moderation_logs enable row level security;
alter table public.payment_orders enable row level security;

-- Helper: admin kontrolü
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role in ('admin', 'moderator')
  );
$$;

-- Helper: premium aktifleştirme
create or replace function public.activate_listing_premium(target_listing_id uuid, premium_days integer default 7)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set
    is_featured = true,
    featured_until = now() + make_interval(days => premium_days),
    updated_at = now()
  where id = target_listing_id;
end;
$$;

-- RLS policies: tekrar çalıştırılabilir olması için önce sil
-- Profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;

create policy "profiles_select_own_or_admin" on public.profiles
for select using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own_or_admin" on public.profiles
for update using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));

-- Listings
drop policy if exists "listings_public_read_approved" on public.listings;
drop policy if exists "listings_owner_read" on public.listings;
drop policy if exists "listings_owner_insert" on public.listings;
drop policy if exists "listings_owner_update_pending_passive" on public.listings;
drop policy if exists "listings_admin_all" on public.listings;

create policy "listings_public_read_approved" on public.listings
for select using (status = 'approved');

create policy "listings_owner_read" on public.listings
for select using (auth.uid() = user_id);

create policy "listings_owner_insert" on public.listings
for insert with check (auth.uid() = user_id);

create policy "listings_owner_update_pending_passive" on public.listings
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id and status in ('pending', 'passive', 'sold'));

create policy "listings_admin_all" on public.listings
for all using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Listing images
drop policy if exists "listing_images_read_for_visible_listings" on public.listing_images;
drop policy if exists "listing_images_owner_insert" on public.listing_images;
drop policy if exists "listing_images_owner_delete" on public.listing_images;
drop policy if exists "listing_images_admin_all" on public.listing_images;

create policy "listing_images_read_for_visible_listings" on public.listing_images
for select using (
  exists (
    select 1 from public.listings l
    where l.id = listing_id and (l.status = 'approved' or l.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

create policy "listing_images_owner_insert" on public.listing_images
for insert with check (
  exists (select 1 from public.listings l where l.id = listing_id and l.user_id = auth.uid())
);

create policy "listing_images_owner_delete" on public.listing_images
for delete using (
  exists (select 1 from public.listings l where l.id = listing_id and l.user_id = auth.uid())
);

create policy "listing_images_admin_all" on public.listing_images
for all using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Favorites
drop policy if exists "favorites_owner_all" on public.favorites;
create policy "favorites_owner_all" on public.favorites
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Conversations
drop policy if exists "conversations_participant_read" on public.conversations;
drop policy if exists "conversations_participant_insert" on public.conversations;
drop policy if exists "conversations_participant_update" on public.conversations;

create policy "conversations_participant_read" on public.conversations
for select using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin(auth.uid()));

create policy "conversations_participant_insert" on public.conversations
for insert with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "conversations_participant_update" on public.conversations
for update using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin(auth.uid()));

-- Messages
drop policy if exists "messages_participant_read" on public.messages;
drop policy if exists "messages_participant_insert" on public.messages;
drop policy if exists "messages_participant_update_read" on public.messages;

create policy "messages_participant_read" on public.messages
for select using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

create policy "messages_participant_insert" on public.messages
for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

create policy "messages_participant_update_read" on public.messages
for update using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

-- Notifications
drop policy if exists "notifications_owner_read_update" on public.notifications;
drop policy if exists "notifications_admin_insert" on public.notifications;

create policy "notifications_owner_read_update" on public.notifications
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "notifications_admin_insert" on public.notifications
for insert with check (public.is_admin(auth.uid()));

-- Moderation logs / payments admin ağırlıklı
drop policy if exists "moderation_logs_admin_all" on public.moderation_logs;
create policy "moderation_logs_admin_all" on public.moderation_logs
for all using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "payment_orders_owner_read" on public.payment_orders;
drop policy if exists "payment_orders_admin_all" on public.payment_orders;
create policy "payment_orders_owner_read" on public.payment_orders
for select using (auth.uid() = user_id);
create policy "payment_orders_admin_all" on public.payment_orders
for all using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Storage bucket: ilan fotoğrafları
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

-- Storage policies
-- Supabase bazı projelerde policy adı çakışırsa hata verir; gerekirse Storage > Policies ekranından eski listing-images policy'lerini silip tekrar çalıştır.
drop policy if exists "listing_images_public_read" on storage.objects;
drop policy if exists "listing_images_authenticated_upload" on storage.objects;
drop policy if exists "listing_images_owner_update_delete" on storage.objects;

create policy "listing_images_public_read" on storage.objects
for select using (bucket_id = 'listing-images');

create policy "listing_images_authenticated_upload" on storage.objects
for insert to authenticated
with check (bucket_id = 'listing-images');

create policy "listing_images_owner_update_delete" on storage.objects
for all to authenticated
using (bucket_id = 'listing-images' and owner = auth.uid())
with check (bucket_id = 'listing-images' and owner = auth.uid());
