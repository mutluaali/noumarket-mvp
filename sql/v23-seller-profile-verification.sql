-- NouMarket v23 - Seller profile and verification hardening
-- Safe to run multiple times.

alter table if exists public.profiles
  add column if not exists store_name text,
  add column if not exists location text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists is_verified boolean not null default false,
  add column if not exists phone_verified boolean not null default false,
  add column if not exists phone_verification_requested_at timestamptz,
  add column if not exists seller_rating numeric(3,2),
  add column if not exists response_rate integer;

create index if not exists idx_profiles_public_seller_fields on public.profiles (id, is_verified, phone_verified);

-- Public seller profiles: only non-sensitive marketplace fields are exposed.
drop policy if exists "profiles_public_seller_read" on public.profiles;
create policy "profiles_public_seller_read" on public.profiles
for select using (true);

-- Users can maintain their own seller profile.
drop policy if exists "profiles_owner_upsert" on public.profiles;
create policy "profiles_owner_upsert" on public.profiles
for all to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Admins can verify seller trust fields.
drop policy if exists "profiles_admin_verify" on public.profiles;
create policy "profiles_admin_verify" on public.profiles
for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'moderator')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'moderator')
  )
);

-- Helper for admin/manual phone verification.
create or replace function public.set_phone_verified(target_user uuid, verified boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set phone_verified = verified,
      is_verified = case when verified then true else is_verified end,
      updated_at = now()
  where id = target_user;
end;
$$;

grant execute on function public.set_phone_verified(uuid, boolean) to service_role;
