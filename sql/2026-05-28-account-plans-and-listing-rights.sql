-- NouMarket account plans, yearly listing rights, and premium seller fields.
-- Safe to run more than once.

alter table public.profiles
  add column if not exists account_plan text not null default 'free',
  add column if not exists premium_status text not null default 'inactive',
  add column if not exists premium_started_at timestamptz,
  add column if not exists premium_ends_at timestamptz,
  add column if not exists yearly_free_listing_limit integer not null default 1,
  add column if not exists yearly_free_listing_used integer not null default 0,
  add column if not exists free_listing_cycle_year integer not null default extract(year from now())::integer,
  add column if not exists listing_photo_limit integer not null default 5,
  add column if not exists can_add_video boolean not null default false,
  add column if not exists has_storefront boolean not null default false,
  add column if not exists boost_discount_percent integer not null default 0;

alter table public.listings
  add column if not exists listing_type text,
  add column if not exists created_with_free_quota boolean not null default false,
  add column if not exists paid_listing_payment_id text,
  add column if not exists seller_plan_at_creation text,
  add column if not exists expires_at timestamptz,
  add column if not exists is_boosted boolean not null default false,
  add column if not exists boost_ends_at timestamptz,
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_ends_at timestamptz,
  add column if not exists cover_image_url text;

alter table public.profiles
  drop constraint if exists profiles_account_plan_check,
  add constraint profiles_account_plan_check
    check (account_plan in ('free', 'premium_seller'));

alter table public.profiles
  drop constraint if exists profiles_premium_status_check,
  add constraint profiles_premium_status_check
    check (premium_status in ('active', 'inactive', 'past_due', 'canceled'));

alter table public.listings
  drop constraint if exists listings_listing_type_check,
  add constraint listings_listing_type_check
    check (listing_type is null or listing_type in ('free', 'paid', 'premium_seller'));

create index if not exists idx_profiles_account_plan on public.profiles(account_plan, premium_status);
create index if not exists idx_listings_user_created_year on public.listings(user_id, created_at);
create index if not exists idx_listings_boosted on public.listings(is_boosted, boost_ends_at);

create or replace function public.refresh_expired_premium_sellers()
returns void
language sql
security definer
as $$
  update public.profiles
     set account_plan = 'free',
         premium_status = 'inactive',
         listing_photo_limit = 5,
         can_add_video = false,
         has_storefront = false,
         boost_discount_percent = 0,
         updated_at = now()
   where account_plan = 'premium_seller'
     and premium_status = 'active'
     and premium_ends_at is not null
     and premium_ends_at < now();
$$;

-- RLS policy proposal. Enable only after confirming existing policy names.
-- alter table public.listings enable row level security;
-- create policy "Owners can update their own listings"
--   on public.listings for update
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);
