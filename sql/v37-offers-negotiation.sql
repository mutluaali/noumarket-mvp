-- V37 - Offers / negotiation system
create table if not exists public.listing_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  message text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listing_offers_listing_id_idx on public.listing_offers(listing_id);
create index if not exists listing_offers_buyer_id_idx on public.listing_offers(buyer_id);
create index if not exists listing_offers_seller_id_idx on public.listing_offers(seller_id);
create index if not exists listing_offers_status_idx on public.listing_offers(status);

alter table public.listing_offers enable row level security;

drop policy if exists listing_offers_participants_select on public.listing_offers;
create policy listing_offers_participants_select on public.listing_offers
for select to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists listing_offers_buyer_insert on public.listing_offers;
create policy listing_offers_buyer_insert on public.listing_offers
for insert to authenticated
with check (buyer_id = auth.uid() and seller_id <> auth.uid());

drop policy if exists listing_offers_participants_update on public.listing_offers;
create policy listing_offers_participants_update on public.listing_offers
for update to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid())
with check (buyer_id = auth.uid() or seller_id = auth.uid());

create table if not exists public.offer_events (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references public.listing_offers(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.offer_events enable row level security;

drop policy if exists offer_events_participants_select on public.offer_events;
create policy offer_events_participants_select on public.offer_events
for select to authenticated
using (
  exists (
    select 1 from public.listing_offers o
    where o.id = offer_events.offer_id
      and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
  )
);

drop policy if exists offer_events_actor_insert on public.offer_events;
create policy offer_events_actor_insert on public.offer_events
for insert to authenticated
with check (actor_id = auth.uid());
