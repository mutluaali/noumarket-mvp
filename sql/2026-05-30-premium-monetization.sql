-- NouMarket — Premium monetization MVP (idempotent)
-- Featured listing payments + Premium Seller subscriptions

alter table if exists public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists idx_profiles_stripe_subscription_id
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

alter table if exists public.payment_orders
  add column if not exists product_type text default 'featured_listing';

create index if not exists idx_payment_orders_product_type
  on public.payment_orders (product_type, status, paid_at desc);

comment on column public.payment_orders.product_type is
  'featured_listing | premium_seller';
