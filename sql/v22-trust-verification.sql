-- NouMarket v22 - Trust profile fields
-- Supabase SQL Editor'da bir kez çalıştır.

alter table public.profiles add column if not exists store_name text;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists is_verified boolean not null default false;
alter table public.profiles add column if not exists phone_verified boolean not null default false;
alter table public.profiles add column if not exists updated_at timestamptz default now();

create index if not exists profiles_store_name_idx on public.profiles using btree (store_name);
create index if not exists profiles_location_idx on public.profiles using btree (location);
create index if not exists profiles_verified_idx on public.profiles using btree (is_verified, phone_verified);

-- Kullanıcı kendi profilini okuyup güncelleyebilsin.
alter table public.profiles enable row level security;

do $$
begin
  create policy "profiles_select_own_v22" on public.profiles
  for select to authenticated
  using (id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "profiles_insert_own_v22" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "profiles_update_own_v22" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
exception when duplicate_object then null;
end $$;
