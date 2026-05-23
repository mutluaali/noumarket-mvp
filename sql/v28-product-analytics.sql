-- NouMarket V28 - Product analytics, event tracking and funnel measurement

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid null references auth.users(id) on delete set null,
  session_id text,
  path text,
  referrer text,
  user_agent text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name);
create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
create index if not exists analytics_events_session_id_idx on public.analytics_events(session_id);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);
create index if not exists analytics_events_properties_gin_idx on public.analytics_events using gin(properties);

alter table public.analytics_events enable row level security;

-- Analytics insert herkese açık bırakıldı; admin okuması server-side service-role ile yapılır.
-- Abuse riskini azaltmak için client tarafında küçük payload temizliği var. Production'da ayrıca edge rate-limit önerilir.
drop policy if exists "analytics_events_public_insert" on public.analytics_events;
create policy "analytics_events_public_insert"
on public.analytics_events
for insert
to anon, authenticated
with check (event_name is not null and length(event_name) <= 80);

drop policy if exists "analytics_events_admin_read" on public.analytics_events;
create policy "analytics_events_admin_read"
on public.analytics_events
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role in ('admin', 'moderator')
  )
);

create or replace view public.analytics_daily_summary as
select
  date_trunc('day', created_at)::date as day,
  event_name,
  count(*) as event_count,
  count(distinct session_id) as unique_sessions,
  count(distinct user_id) as unique_users
from public.analytics_events
group by 1, 2
order by day desc, event_count desc;
