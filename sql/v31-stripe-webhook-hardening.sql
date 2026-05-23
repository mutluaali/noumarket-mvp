-- NouMarket V31 - Stripe webhook ve premium ödeme güvenilirliği
-- Bu migration tekrar çalıştırılabilir şekilde yazıldı.

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'stripe',
  provider_event_id text not null unique,
  provider_session_id text,
  event_type text,
  status text not null default 'received',
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payment_events enable row level security;

create index if not exists idx_payment_events_provider_event_id on public.payment_events(provider_event_id);
create index if not exists idx_payment_events_session_id on public.payment_events(provider_session_id);
create index if not exists idx_payment_events_status on public.payment_events(status);
create index if not exists idx_payment_events_created_at on public.payment_events(created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_events'
      and policyname = 'Admins can read payment events'
  ) then
    create policy "Admins can read payment events"
      on public.payment_events
      for select
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_events'
      and policyname = 'Service role manages payment events'
  ) then
    create policy "Service role manages payment events"
      on public.payment_events
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

alter table public.payment_orders
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists provider_payment_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_payment_orders_provider_session_id on public.payment_orders(provider_session_id);
create index if not exists idx_payment_orders_stripe_session_id on public.payment_orders(stripe_session_id);
create index if not exists idx_payment_orders_status on public.payment_orders(status);
create index if not exists idx_payment_orders_listing_id on public.payment_orders(listing_id);

-- Eski kayıtlarda stripe_session_id boşsa provider_session_id ile doldur.
update public.payment_orders
set stripe_session_id = provider_session_id
where stripe_session_id is null
  and provider_session_id is not null;

-- Premium bitişini hızlandırmak için index.
create index if not exists idx_listings_premium_until on public.listings(premium_until)
where premium_until is not null;
