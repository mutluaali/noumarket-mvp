-- V35 Smart Feed & Recommendations
-- Lightweight tracking table for future recommendation ranking.
create table if not exists public.feed_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  listing_id uuid references public.listings(id) on delete cascade,
  event_type text not null check (event_type in ('impression','click','favorite','message_start','hide')),
  source text default 'smart_feed',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.feed_events enable row level security;

drop policy if exists "feed_events_insert_authenticated" on public.feed_events;
create policy "feed_events_insert_authenticated" on public.feed_events
for insert to authenticated
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "feed_events_admin_read" on public.feed_events;
create policy "feed_events_admin_read" on public.feed_events
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create index if not exists feed_events_listing_idx on public.feed_events(listing_id, created_at desc);
create index if not exists feed_events_user_idx on public.feed_events(user_id, created_at desc);
