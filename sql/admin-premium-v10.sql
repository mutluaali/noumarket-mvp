-- NouMarket v10 - Admin panel + premium/payment hardening
-- Safe migration: existing columns/types are preserved where possible.

create extension if not exists pgcrypto;

-- Enum safety
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'moderator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'moderator';
EXCEPTION WHEN undefined_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.listing_status AS ENUM ('pending', 'approved', 'rejected', 'passive', 'sold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'passive';
  ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'sold';
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- Profiles role column fallback
alter table if exists public.profiles
  add column if not exists role public.user_role default 'user';

-- Premium columns
alter table if exists public.listings
  add column if not exists is_premium boolean default false,
  add column if not exists is_featured boolean default false,
  add column if not exists premium_until timestamptz,
  add column if not exists featured_until timestamptz,
  add column if not exists view_count integer default 0;

create index if not exists idx_listings_premium_until on public.listings(premium_until);
create index if not exists idx_listings_featured_until on public.listings(featured_until);
create index if not exists idx_listings_status_featured_created on public.listings(status, is_featured, created_at desc);

-- Payment orders
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  provider text not null default 'stripe',
  provider_session_id text,
  stripe_session_id text,
  provider_payment_id text,
  plan text,
  amount integer not null default 0,
  currency text not null default 'XPF',
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create unique index if not exists idx_payment_orders_provider_session_id on public.payment_orders(provider_session_id) where provider_session_id is not null;
create index if not exists idx_payment_orders_user_id on public.payment_orders(user_id);
create index if not exists idx_payment_orders_listing_id on public.payment_orders(listing_id);
create index if not exists idx_payment_orders_status_created on public.payment_orders(status, created_at desc);

alter table public.payment_orders enable row level security;

drop policy if exists "Users can read own payment orders" on public.payment_orders;
create policy "Users can read own payment orders"
  on public.payment_orders for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can read all payment orders" on public.payment_orders;
create policy "Admins can read all payment orders"
  on public.payment_orders for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'moderator')
    )
  );

-- Reports hardening
alter table if exists public.listing_reports
  add column if not exists status text default 'open',
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create index if not exists idx_listing_reports_status_created on public.listing_reports(status, created_at desc);

-- Admin helper functions
create or replace function public.is_platform_admin(uid uuid default auth.uid())
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

grant execute on function public.is_platform_admin(uuid) to authenticated;

create or replace function public.activate_listing_premium(target_listing_id uuid, premium_days integer default 7)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set
    is_premium = true,
    is_featured = true,
    premium_until = greatest(coalesce(premium_until, now()), now()) + make_interval(days => greatest(premium_days, 1)),
    featured_until = greatest(coalesce(featured_until, now()), now()) + make_interval(days => greatest(premium_days, 1)),
    updated_at = now()
  where id = target_listing_id;
end;
$$;

grant execute on function public.activate_listing_premium(uuid, integer) to service_role;

grant select, update on public.listing_reports to authenticated;
grant select on public.payment_orders to authenticated;

-- Optional: mark expired premium listings. You can call this from /api/expire-premiums or Supabase cron.
-- PostgreSQL cannot change an existing function return type with CREATE OR REPLACE,
-- so we drop the old version first to make this migration safe.
drop function if exists public.expire_old_premium_listings();

create or replace function public.expire_old_premium_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare affected_count integer;
begin
  update public.listings
  set is_premium = false,
      is_featured = false,
      updated_at = now()
  where (is_premium = true or is_featured = true)
    and coalesce(premium_until, featured_until) is not null
    and coalesce(premium_until, featured_until) < now();

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

grant execute on function public.expire_old_premium_listings() to service_role;
