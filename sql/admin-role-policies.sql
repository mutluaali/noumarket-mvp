-- NouMarket admin role security update
-- 1) Run this file in Supabase SQL Editor.
-- 2) Replace the email below with your own admin account email.

-- Make sure role column exists.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    alter table public.profiles add column role text default 'user';
  end if;
end $$;

-- Helper function used by RLS policies.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Promote your account to admin. Change the email before running.
update public.profiles
set role = 'admin'
where id in (
  select id from auth.users where email = 'mutlu.aali@gmail.com'
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;

-- Remove earlier broad/unsafe listing policies if they exist.
drop policy if exists "admins can view all listings" on public.listings;
drop policy if exists "admins can update listings" on public.listings;
drop policy if exists "admins can delete listings" on public.listings;
drop policy if exists "Admins can manage listings" on public.listings;
drop policy if exists "public approved listings" on public.listings;
drop policy if exists "Read approved listings" on public.listings;
drop policy if exists "authenticated users can insert" on public.listings;
drop policy if exists "Create own listings" on public.listings;
drop policy if exists "Update own pending listings" on public.listings;
drop policy if exists "owner can read own listings" on public.listings;
drop policy if exists "owner can update own pending listings" on public.listings;
drop policy if exists "admin can select all listings" on public.listings;
drop policy if exists "admin can update listings" on public.listings;
drop policy if exists "admin can delete listings" on public.listings;

-- Safer listing policies.
create policy "public approved listings"
on public.listings
for select
using (status = 'approved');

create policy "owner can read own listings"
on public.listings
for select
to authenticated
using (auth.uid() = user_id);

create policy "authenticated users can insert own listings"
on public.listings
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "owner can update own pending or rejected listings"
on public.listings
for update
to authenticated
using (auth.uid() = user_id and status in ('pending', 'rejected'))
with check (auth.uid() = user_id);

create policy "admin can select all listings"
on public.listings
for select
to authenticated
using (public.is_admin());

create policy "admin can update listings"
on public.listings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin can delete listings"
on public.listings
for delete
to authenticated
using (public.is_admin());

-- Profile policies.
drop policy if exists "Read own profile" on public.profiles;
drop policy if exists "Update own profile" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profiles owner select" on public.profiles;
drop policy if exists "profiles owner update" on public.profiles;
drop policy if exists "admin select all profiles" on public.profiles;

create policy "profiles owner select"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles owner update"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "admin select all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());
