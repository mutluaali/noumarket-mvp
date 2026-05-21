alter table payment_orders add column if not exists provider_session_id text;
alter table payment_orders add column if not exists provider_payment_id text;
alter table payment_orders add column if not exists paid_at timestamptz;
alter table payment_orders add column if not exists metadata jsonb default '{}'::jsonb;

create index if not exists payment_orders_provider_session_id_idx
on payment_orders(provider_session_id);

create or replace function activate_listing_premium(target_listing_id uuid, premium_days integer)
returns void as $$
begin
  update listings
  set
    is_featured = true,
    featured_until = now() + make_interval(days => premium_days),
    updated_at = now()
  where id = target_listing_id;
end;
$$ language plpgsql security definer;
