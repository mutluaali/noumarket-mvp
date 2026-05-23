-- NouMarket v8 - Şikayet ve güven altyapısı

create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listing_reports_listing_id on public.listing_reports(listing_id);
create index if not exists idx_listing_reports_reporter_id on public.listing_reports(reporter_id);
create index if not exists idx_listing_reports_status_created_at on public.listing_reports(status, created_at desc);

alter table public.listing_reports enable row level security;

drop policy if exists listing_reports_insert_own on public.listing_reports;
create policy listing_reports_insert_own on public.listing_reports
for insert to authenticated
with check (reporter_id = auth.uid());

drop policy if exists listing_reports_read_own on public.listing_reports;
create policy listing_reports_read_own on public.listing_reports
for select to authenticated
using (reporter_id = auth.uid());

drop policy if exists listing_reports_admin_all on public.listing_reports;
create policy listing_reports_admin_all on public.listing_reports
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Mevcut profiles tablosu için güven alanları. Çakışmaz.
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists is_verified boolean not null default false;
alter table public.profiles add column if not exists seller_score numeric not null default 0;
alter table public.profiles add column if not exists response_time_minutes integer;
