alter table listings
add column if not exists is_premium boolean default false;

alter table listings
add column if not exists premium_until timestamptz;

alter table payment_orders
add column if not exists provider_session_id text;

alter table payment_orders
add column if not exists status text default 'pending';
