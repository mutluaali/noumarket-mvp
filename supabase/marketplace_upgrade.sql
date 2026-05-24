-- NouMarket marketplace upgrade
-- Supabase SQL Editor içinde çalıştır.

alter table listings add column if not exists category_id text;
alter table listings add column if not exists subcategory_id text;
alter table listings add column if not exists category_label text;
alter table listings add column if not exists attributes jsonb default '{}'::jsonb;
alter table listings add column if not exists trust_score integer;
alter table listings add column if not exists moderation_note text;
alter table listings add column if not exists featured_until timestamptz;

create index if not exists listings_status_created_idx on listings(status, created_at desc);
create index if not exists listings_category_id_idx on listings(category_id);
create index if not exists listings_subcategory_id_idx on listings(subcategory_id);
create index if not exists listings_featured_idx on listings(is_featured, featured_until);
create index if not exists listings_attributes_gin_idx on listings using gin(attributes);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  listing_id uuid references listings(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz default now(),
  resolved_at timestamptz
);

alter table audit_logs enable row level security;
alter table reports enable row level security;

drop policy if exists "Users can create reports" on reports;
create policy "Users can create reports"
on reports
for insert
to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "Admins can manage reports" on reports;
create policy "Admins can manage reports"
on reports
for all
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can read audit logs" on audit_logs;
create policy "Admins can read audit logs"
on audit_logs
for select
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Adminlerin ilanları yönetebilmesi için örnek policy. Mevcut policy varsa adlarını projene göre kontrol et.
drop policy if exists "Admins can manage listings" on listings;
create policy "Admins can manage listings"
on listings
for all
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
