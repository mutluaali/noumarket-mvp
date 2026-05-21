-- NouMarket Payments & Premium Activation
-- Safe/idempotent version for Supabase SQL Editor

create table if not exists payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  provider text not null default 'manual',
  provider_session_id text,
  amount integer not null default 0,
  currency text not null default 'XPF',
  product_type text not null default 'premium_listing',
  premium_days integer not null default 7,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table payment_orders enable row level security;

drop policy if exists "Users can read own payment orders" on payment_orders;
create policy "Users can read own payment orders"
on payment_orders
for select
to authenticated
using (
  auth.uid() = user_id
);

drop policy if exists "Users can create own payment orders" on payment_orders;
create policy "Users can create own payment orders"
on payment_orders
for insert
to authenticated
with check (
  auth.uid() = user_id
);

drop policy if exists "Admins can read all payment orders" on payment_orders;
create policy "Admins can read all payment orders"
on payment_orders
for select
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update payment orders" on payment_orders;
create policy "Admins can update payment orders"
on payment_orders
for update
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create index if not exists idx_payment_orders_user_id on payment_orders(user_id);
create index if not exists idx_payment_orders_listing_id on payment_orders(listing_id);
create index if not exists idx_payment_orders_status on payment_orders(status);

alter table listings add column if not exists featured_until timestamptz;
alter table listings add column if not exists premium_source text;

create or replace function activate_listing_premium(
  target_listing_id uuid,
  premium_days integer default 7
)
returns void as $$
begin
  update listings
  set
    is_featured = true,
    featured_until = now() + make_interval(days => premium_days),
    premium_source = 'payment',
    updated_at = now()
  where id = target_listing_id;
end;
$$ language plpgsql security definer;

create or replace function expire_old_premium_listings()
returns void as $$
begin
  update listings
  set
    is_featured = false,
    premium_source = null,
    updated_at = now()
  where
    is_featured = true
    and featured_until is not null
    and featured_until < now();
end;
$$ language plpgsql security definer;
