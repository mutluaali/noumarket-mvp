-- NouMarket V25 - Onboarding & retention support
-- Migration-safe. Çalıştırmak güvenlidir.

create table if not exists public.user_activation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('onboarding_completed','first_listing','first_favorite','first_message','return_visit')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_activation_events_user_id_idx on public.user_activation_events(user_id);
create index if not exists user_activation_events_event_type_idx on public.user_activation_events(event_type);
create index if not exists user_activation_events_created_at_idx on public.user_activation_events(created_at desc);

alter table public.user_activation_events enable row level security;

drop policy if exists "Users can read own activation events" on public.user_activation_events;
create policy "Users can read own activation events"
on public.user_activation_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own activation events" on public.user_activation_events;
create policy "Users can insert own activation events"
on public.user_activation_events
for insert
to authenticated
with check (auth.uid() = user_id);

-- Adminler tüm aktivasyon sinyallerini okuyabilir.
drop policy if exists "Admins can read activation events" on public.user_activation_events;
create policy "Admins can read activation events"
on public.user_activation_events
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- Profiles tablosuna onboarding alanları. Eski şemalarla çakışmaz.
alter table if exists public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists activation_score integer not null default 0;

create or replace function public.mark_user_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set last_seen_at = now()
  where id = auth.uid();
end;
$$;
