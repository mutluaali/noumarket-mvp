-- NouMarket — User suspension columns + RLS hardening
-- Idempotent: safe to run multiple times.

alter table if exists public.profiles
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid references auth.users(id) on delete set null,
  add column if not exists suspension_reason text;

create index if not exists idx_profiles_is_suspended on public.profiles (is_suspended)
  where is_suspended = true;

create or replace function public.is_user_suspended(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_suspended from public.profiles p where p.id = uid),
    false
  );
$$;

grant execute on function public.is_user_suspended(uuid) to authenticated;
grant execute on function public.is_user_suspended(uuid) to anon;

-- Block suspended users at RLS layer (defense in depth with app/API checks).

drop policy if exists nm_listings_owner_insert on public.listings;
create policy nm_listings_owner_insert on public.listings
for insert
to authenticated
with check (
  auth.uid() = user_id
  and coalesce(status, 'pending') in ('pending', 'passive', 'rejected')
  and not public.is_user_suspended(auth.uid())
);

drop policy if exists nm_listings_owner_update on public.listings;
create policy nm_listings_owner_update on public.listings
for update
to authenticated
using (
  auth.uid() = user_id
  and status in ('pending', 'rejected', 'passive', 'sold')
  and not public.is_user_suspended(auth.uid())
)
with check (
  auth.uid() = user_id
  and status in ('pending', 'rejected', 'passive', 'sold')
  and not public.is_user_suspended(auth.uid())
);

drop policy if exists nm_messages_participant_insert on public.messages;
create policy nm_messages_participant_insert on public.messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and not public.is_user_suspended(auth.uid())
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

drop policy if exists nm_listing_reports_insert_own on public.listing_reports;
create policy nm_listing_reports_insert_own on public.listing_reports
for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and not public.is_user_suspended(auth.uid())
);

do $$
begin
  if to_regclass('public.favorites') is not null then
    execute 'drop policy if exists nm_favorites_insert_own on public.favorites';
    execute $sql$
      create policy nm_favorites_insert_own on public.favorites
      for insert to authenticated
      with check (
        auth.uid() = user_id
        and not public.is_user_suspended(auth.uid())
      )
    $sql$;
  end if;
end $$;
