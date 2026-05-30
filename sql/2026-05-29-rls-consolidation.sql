-- =============================================================================
-- NouMarket — RLS Consolidation (DRAFT — DO NOT RUN ON PRODUCTION WITHOUT REVIEW)
-- =============================================================================
-- Purpose:
--   Replace duplicate/legacy RLS policies with one canonical policy set aligned
--   with the NouMarket app (admin + moderator staff model).
--
-- Idempotent: safe to re-run after review (drops known legacy + canonical names).
--
-- PREREQUISITES (recommended, run first if missing):
--   1. sql/noumarket-core-schema-v4.sql          (base tables)
--   2. sql/admin-premium-v10.sql                 (is_platform_admin baseline)
--   3. sql/2026-05-28-account-plans-and-listing-rights.sql  (listings.expires_at)
--   4. sql/reports-trust-v8.sql                    (listing_reports table)
--   5. sql/multi-image.sql                         (listing_images table)
--   6. sql/2026-05-29-listing-rejected-reason.sql  (optional, moderation copy)
--
-- IMPORTANT APP BEHAVIOR NOTES:
--   * Approved listing edits → pending are handled by /api/my-listings/[id]
--     (service role), NOT by permissive client UPDATE on approved rows.
--   * AdminPanel approve/reject uses client Supabase + staff RLS policies.
--   * This migration intentionally BLOCKS direct client UPDATE on approved listings.
--
-- AFTER APPLYING: run sql/production-rls-inventory-readonly.sql and the
-- post-migration checklist at the bottom of this file.
-- =============================================================================


-- =============================================================================
-- SECTION 1 — Canonical staff helper (admin + moderator)
-- =============================================================================

create or replace function public.is_platform_admin(uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role::text in ('admin', 'moderator')
  );
$$;

grant execute on function public.is_platform_admin(uuid) to authenticated;

-- Backward-compatible wrappers (avoid stale overload confusion in old policies).
-- Policies in this file use is_platform_admin directly.

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_platform_admin(uid);
$$;

grant execute on function public.is_admin(uuid) to authenticated;


-- =============================================================================
-- SECTION 2 — Enable RLS on target tables (idempotent)
-- =============================================================================

alter table if exists public.listings enable row level security;
alter table if exists public.profiles enable row level security;
alter table if exists public.conversations enable row level security;
alter table if exists public.messages enable row level security;
alter table if exists public.listing_images enable row level security;
alter table if exists public.listing_reports enable row level security;
alter table if exists public.favorites enable row level security;


-- =============================================================================
-- SECTION 3 — DROP legacy / duplicate policies (public.listings)
-- =============================================================================

-- Core v4
drop policy if exists "listings_public_read_approved" on public.listings;
drop policy if exists "listings_owner_read" on public.listings;
drop policy if exists "listings_owner_insert" on public.listings;
drop policy if exists "listings_owner_update_pending_passive" on public.listings;
drop policy if exists "listings_admin_all" on public.listings;

-- 2026 public read patch
drop policy if exists "Public can read approved listings" on public.listings;
drop policy if exists "Owners can read own listings" on public.listings;

-- admin-role-policies.sql
drop policy if exists "public approved listings" on public.listings;
drop policy if exists "owner can read own listings" on public.listings;
drop policy if exists "authenticated users can insert own listings" on public.listings;
drop policy if exists "owner can update own pending or rejected listings" on public.listings;
drop policy if exists "admin can select all listings" on public.listings;
drop policy if exists "admin can update listings" on public.listings;
drop policy if exists "admin can delete listings" on public.listings;

-- marketplace_upgrade / misc legacy names
drop policy if exists "Admins can manage listings" on public.listings;
drop policy if exists "admins can view all listings" on public.listings;
drop policy if exists "admins can update listings" on public.listings;
drop policy if exists "admins can delete listings" on public.listings;
drop policy if exists "Read approved listings" on public.listings;
drop policy if exists "Create own listings" on public.listings;
drop policy if exists "Update own pending listings" on public.listings;
drop policy if exists "Users can update own listings" on public.listings;
drop policy if exists "users can view own listings" on public.listings;
drop policy if exists "users can update own listings" on public.listings;
drop policy if exists "users can delete own listings" on public.listings;
drop policy if exists "Owners can update their own listings" on public.listings;

-- Canonical names (re-run safe)
drop policy if exists nm_listings_public_read on public.listings;
drop policy if exists nm_listings_owner_read on public.listings;
drop policy if exists nm_listings_owner_insert on public.listings;
drop policy if exists nm_listings_owner_update on public.listings;
drop policy if exists nm_listings_staff_all on public.listings;


-- =============================================================================
-- SECTION 4 — CREATE canonical policies (public.listings)
-- =============================================================================

-- Public marketplace: approved + not expired (expires_at optional — see DO block below).
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listings'
      and column_name = 'expires_at'
  ) then
    execute $sql$
      create policy nm_listings_public_read on public.listings
      for select
      using (
        status = 'approved'
        and (expires_at is null or expires_at >= now())
      )
    $sql$;
  else
    execute $sql$
      create policy nm_listings_public_read on public.listings
      for select
      using (status = 'approved')
    $sql$;
  end if;
end $$;

-- Owners can read all of their listings regardless of status.
create policy nm_listings_owner_read on public.listings
for select
to authenticated
using (auth.uid() = user_id);

-- Authenticated users create listings for themselves (app defaults status to pending).
create policy nm_listings_owner_insert on public.listings
for insert
to authenticated
with check (
  auth.uid() = user_id
  and coalesce(status, 'pending') in ('pending', 'passive', 'rejected')
);

-- Direct client updates allowed only on non-approved rows.
-- Approved listing edits must go through /api/my-listings/[id] (service role).
create policy nm_listings_owner_update on public.listings
for update
to authenticated
using (
  auth.uid() = user_id
  and status in ('pending', 'rejected', 'passive', 'sold')
)
with check (
  auth.uid() = user_id
  and status in ('pending', 'rejected', 'passive', 'sold')
);

-- Platform staff (admin + moderator): full moderation access.
create policy nm_listings_staff_all on public.listings
for all
to authenticated
using (public.is_platform_admin(auth.uid()))
with check (public.is_platform_admin(auth.uid()));


-- =============================================================================
-- SECTION 5 — DROP legacy / duplicate policies (public.profiles)
-- =============================================================================

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
drop policy if exists "profiles owner select" on public.profiles;
drop policy if exists "profiles owner insert" on public.profiles;
drop policy if exists "profiles owner update" on public.profiles;
drop policy if exists "profiles_select_own_v22" on public.profiles;
drop policy if exists "profiles_insert_own_v22" on public.profiles;
drop policy if exists "profiles_update_own_v22" on public.profiles;
drop policy if exists "profiles_public_seller_read" on public.profiles;
drop policy if exists "profiles_owner_upsert" on public.profiles;
drop policy if exists "profiles_admin_verify" on public.profiles;
drop policy if exists "admin select all profiles" on public.profiles;
drop policy if exists "Read own profile" on public.profiles;
drop policy if exists "Update own profile" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists nm_profiles_select_own on public.profiles;
drop policy if exists nm_profiles_public_seller_read on public.profiles;
drop policy if exists nm_profiles_insert_own on public.profiles;
drop policy if exists nm_profiles_update_own on public.profiles;
drop policy if exists nm_profiles_staff_all on public.profiles;


-- =============================================================================
-- SECTION 6 — CREATE canonical policies (public.profiles)
-- =============================================================================

-- Owner reads own profile (includes role, verification flags, etc.).
create policy nm_profiles_select_own on public.profiles
for select
to authenticated
using (auth.uid() = id);

-- Seller pages (/satici/[id]) read public profile rows.
-- NOTE: RLS is row-level; do not store secrets in profiles. Phone/email belong on listings or auth.
create policy nm_profiles_public_seller_read on public.profiles
for select
using (true);

create policy nm_profiles_insert_own on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy nm_profiles_update_own on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Staff can verify/update profiles for moderation workflows.
create policy nm_profiles_staff_all on public.profiles
for all
to authenticated
using (public.is_platform_admin(auth.uid()))
with check (public.is_platform_admin(auth.uid()));


-- =============================================================================
-- SECTION 7 — DROP legacy / duplicate policies (conversations + messages)
-- =============================================================================

-- core v4
drop policy if exists "conversations_participant_read" on public.conversations;
drop policy if exists "conversations_participant_insert" on public.conversations;
drop policy if exists "conversations_participant_update" on public.conversations;
drop policy if exists "messages_participant_read" on public.messages;
drop policy if exists "messages_participant_insert" on public.messages;
drop policy if exists "messages_participant_update_read" on public.messages;

-- messages.sql / v17 / supabase fixes
drop policy if exists "participants can read conversations" on public.conversations;
drop policy if exists "participants can create conversations" on public.conversations;
drop policy if exists "participants can update conversations" on public.conversations;
drop policy if exists "buyers can create conversations" on public.conversations;
drop policy if exists "Users can read own conversations" on public.conversations;
drop policy if exists "Users can insert own conversations" on public.conversations;
drop policy if exists "Users can create conversations" on public.conversations;
drop policy if exists "Users can view their conversations" on public.conversations;
drop policy if exists "Users can update their conversations" on public.conversations;
drop policy if exists "users can create own conversations" on public.conversations;
drop policy if exists "users can view own conversations" on public.conversations;
drop policy if exists "users can update own conversations" on public.conversations;

drop policy if exists "participants can read messages" on public.messages;
drop policy if exists "participants can send messages" on public.messages;
drop policy if exists "participants can mark messages read" on public.messages;
drop policy if exists "Users can read messages in own conversations" on public.messages;
drop policy if exists "Users can insert messages in own conversations" on public.messages;
drop policy if exists "Users can update read state in own conversations" on public.messages;
drop policy if exists "Users can send messages in their conversations" on public.messages;
drop policy if exists "Users can view messages in their conversations" on public.messages;
drop policy if exists "users can send messages in own conversations" on public.messages;
drop policy if exists "users can view own messages" on public.messages;

drop policy if exists nm_conversations_participant_select on public.conversations;
drop policy if exists nm_conversations_participant_insert on public.conversations;
drop policy if exists nm_conversations_participant_update on public.conversations;
drop policy if exists nm_messages_participant_select on public.messages;
drop policy if exists nm_messages_participant_insert on public.messages;
drop policy if exists nm_messages_participant_update on public.messages;


-- =============================================================================
-- SECTION 8 — CREATE canonical policies (conversations + messages)
-- No staff access: admins do not need inbox access in current app.
-- =============================================================================

create policy nm_conversations_participant_select on public.conversations
for select
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy nm_conversations_participant_insert on public.conversations
for insert
to authenticated
with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy nm_conversations_participant_update on public.conversations
for update
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id)
with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy nm_messages_participant_select on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

create policy nm_messages_participant_insert on public.messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

create policy nm_messages_participant_update on public.messages
for update
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);


-- =============================================================================
-- SECTION 9 — DROP legacy / duplicate policies (listing_reports)
-- =============================================================================

drop policy if exists listing_reports_insert_own on public.listing_reports;
drop policy if exists listing_reports_read_own on public.listing_reports;
drop policy if exists listing_reports_admin_all on public.listing_reports;

-- Legacy table (if present from old migrations — ignore if table absent)
drop policy if exists "Users can create reports" on public.reports;
drop policy if exists "Admins can manage reports" on public.reports;

drop policy if exists nm_listing_reports_insert_own on public.listing_reports;
drop policy if exists nm_listing_reports_select_own on public.listing_reports;
drop policy if exists nm_listing_reports_staff_all on public.listing_reports;


-- =============================================================================
-- SECTION 10 — CREATE canonical policies (listing_reports)
-- Requires public.listing_reports (reports-trust-v8.sql).
-- =============================================================================

do $$
begin
  if to_regclass('public.listing_reports') is not null then
    execute $sql$
      create policy nm_listing_reports_insert_own on public.listing_reports
      for insert
      to authenticated
      with check (reporter_id = auth.uid())
    $sql$;

    execute $sql$
      create policy nm_listing_reports_select_own on public.listing_reports
      for select
      to authenticated
      using (reporter_id = auth.uid())
    $sql$;

    execute $sql$
      create policy nm_listing_reports_staff_all on public.listing_reports
      for all
      to authenticated
      using (public.is_platform_admin(auth.uid()))
      with check (public.is_platform_admin(auth.uid()))
    $sql$;
  else
    raise notice 'Skipping listing_reports policies: table public.listing_reports not found.';
  end if;
end $$;


-- =============================================================================
-- SECTION 11 — DROP legacy / duplicate policies (listing_images table)
-- =============================================================================

drop policy if exists "listing_images_read_for_visible_listings" on public.listing_images;
drop policy if exists "listing_images_owner_insert" on public.listing_images;
drop policy if exists "listing_images_owner_delete" on public.listing_images;
drop policy if exists "listing_images_admin_all" on public.listing_images;
drop policy if exists "Public read listing images" on public.listing_images;
drop policy if exists "Authenticated users can read listing images" on public.listing_images;
drop policy if exists "Authenticated users can insert own listing images" on public.listing_images;
drop policy if exists "Authenticated users can update own listing images" on public.listing_images;
drop policy if exists "Authenticated users can delete own listing images" on public.listing_images;

drop policy if exists nm_listing_images_public_read on public.listing_images;
drop policy if exists nm_listing_images_owner_insert on public.listing_images;
drop policy if exists nm_listing_images_owner_delete on public.listing_images;
drop policy if exists nm_listing_images_staff_all on public.listing_images;


-- =============================================================================
-- SECTION 12 — CREATE canonical policies (listing_images table)
-- =============================================================================

do $$
begin
  if to_regclass('public.listing_images') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'listings' and column_name = 'expires_at'
    ) then
      execute $sql$
        create policy nm_listing_images_public_read on public.listing_images
        for select
        using (
          exists (
            select 1
            from public.listings l
            where l.id = listing_images.listing_id
              and l.status = 'approved'
              and (l.expires_at is null or l.expires_at >= now())
          )
        )
      $sql$;
    else
      execute $sql$
        create policy nm_listing_images_public_read on public.listing_images
        for select
        using (
          exists (
            select 1
            from public.listings l
            where l.id = listing_images.listing_id
              and l.status = 'approved'
          )
        )
      $sql$;
    end if;

    execute $sql$
      create policy nm_listing_images_owner_insert on public.listing_images
      for insert
      to authenticated
      with check (
        exists (
          select 1 from public.listings l
          where l.id = listing_images.listing_id
            and l.user_id = auth.uid()
        )
      )
    $sql$;

    execute $sql$
      create policy nm_listing_images_owner_delete on public.listing_images
      for delete
      to authenticated
      using (
        exists (
          select 1 from public.listings l
          where l.id = listing_images.listing_id
            and l.user_id = auth.uid()
        )
      )
    $sql$;

    execute $sql$
      create policy nm_listing_images_staff_all on public.listing_images
      for all
      to authenticated
      using (public.is_platform_admin(auth.uid()))
      with check (public.is_platform_admin(auth.uid()))
    $sql$;
  else
    raise notice 'Skipping listing_images policies: table public.listing_images not found.';
  end if;
end $$;


-- =============================================================================
-- SECTION 13 — DROP legacy / duplicate policies (public.favorites)
-- =============================================================================

drop policy if exists "favorites_owner_all" on public.favorites;
drop policy if exists "Users can read own favorites" on public.favorites;
drop policy if exists "Users can add own favorites" on public.favorites;
drop policy if exists "Users can delete own favorites" on public.favorites;

drop policy if exists nm_favorites_select_own on public.favorites;
drop policy if exists nm_favorites_insert_own on public.favorites;
drop policy if exists nm_favorites_delete_own on public.favorites;


-- =============================================================================
-- SECTION 14 — CREATE canonical policies (public.favorites)
-- =============================================================================

do $$
begin
  if to_regclass('public.favorites') is not null then
    execute $sql$
      create policy nm_favorites_select_own on public.favorites
      for select to authenticated using (auth.uid() = user_id)
    $sql$;
    execute $sql$
      create policy nm_favorites_insert_own on public.favorites
      for insert to authenticated with check (auth.uid() = user_id)
    $sql$;
    execute $sql$
      create policy nm_favorites_delete_own on public.favorites
      for delete to authenticated using (auth.uid() = user_id)
    $sql$;
  end if;
end $$;


-- =============================================================================
-- SECTION 15 — Storage bucket policies (storage.objects / listing-images)
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Legacy storage policy names
drop policy if exists "Public can read listing images" on storage.objects;
drop policy if exists "Authenticated users can upload listing images" on storage.objects;
drop policy if exists "Authenticated users can update own listing images" on storage.objects;
drop policy if exists "Authenticated users can delete own listing images" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Authenticated users can update" on storage.objects;
drop policy if exists "Authenticated users can delete" on storage.objects;
drop policy if exists "Public read access" on storage.objects;
drop policy if exists listing_images_public_read on storage.objects;
drop policy if exists listing_images_authenticated_upload on storage.objects;
drop policy if exists listing_images_owner_update_delete on storage.objects;

drop policy if exists nm_storage_listing_images_public_read on storage.objects;
drop policy if exists nm_storage_listing_images_owner_insert on storage.objects;
drop policy if exists nm_storage_listing_images_owner_update on storage.objects;
drop policy if exists nm_storage_listing_images_owner_delete on storage.objects;
drop policy if exists nm_storage_listing_images_staff_all on storage.objects;

-- Public read (bucket is public in product).
create policy nm_storage_listing_images_public_read on storage.objects
for select
using (bucket_id = 'listing-images');

-- Upload only to listings/{auth.uid()}/...
create policy nm_storage_listing_images_owner_insert on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = 'listings'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy nm_storage_listing_images_owner_update on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = 'listings'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = 'listings'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy nm_storage_listing_images_owner_delete on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = 'listings'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy nm_storage_listing_images_staff_all on storage.objects
for all
to authenticated
using (
  bucket_id = 'listing-images'
  and public.is_platform_admin(auth.uid())
)
with check (
  bucket_id = 'listing-images'
  and public.is_platform_admin(auth.uid())
);


-- =============================================================================
-- SECTION 15b — Final orphan policy sweep (inventory drift names)
-- Re-drop legacy duplicates that survived earlier repo SQL with alternate names.
-- =============================================================================

drop policy if exists "Users can create conversations" on public.conversations;
drop policy if exists "Users can view their conversations" on public.conversations;
drop policy if exists "Users can update their conversations" on public.conversations;
drop policy if exists "users can create own conversations" on public.conversations;
drop policy if exists "users can view own conversations" on public.conversations;
drop policy if exists "users can update own conversations" on public.conversations;

drop policy if exists "Users can send messages in their conversations" on public.messages;
drop policy if exists "Users can view messages in their conversations" on public.messages;
drop policy if exists "users can send messages in own conversations" on public.messages;
drop policy if exists "users can view own messages" on public.messages;

drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Authenticated users can update" on storage.objects;
drop policy if exists "Authenticated users can delete" on storage.objects;
drop policy if exists "Public read access" on storage.objects;


-- =============================================================================
-- SECTION 16 — Align moderation_actions staff policies (optional table)
-- =============================================================================

do $$
begin
  if to_regclass('public.moderation_actions') is not null then
    execute 'drop policy if exists "Admins can read moderation actions" on public.moderation_actions';
    execute 'drop policy if exists "Admins can insert moderation actions" on public.moderation_actions';
    execute 'drop policy if exists nm_moderation_actions_staff_all on public.moderation_actions';

    execute $sql$
      create policy nm_moderation_actions_staff_all on public.moderation_actions
      for all
      to authenticated
      using (public.is_platform_admin(auth.uid()))
      with check (public.is_platform_admin(auth.uid()))
    $sql$;
  end if;
end $$;


-- =============================================================================
-- POST-MIGRATION VERIFICATION CHECKLIST (manual — run after applying)
-- =============================================================================
-- 1) Inventory
--    Run: sql/production-rls-inventory-readonly.sql
--    Expect: listings SELECT policy_count = 3 (public, owner, staff)
--            listings UPDATE policy_count = 2 (owner, staff)
--            conversations/messages: 3 policies each (select/insert/update)
--            profiles SELECT policy_count = 2 (own + public seller read)
--
-- 2) Public listings
--    As anon: select approved listings → rows returned
--    As anon: select pending listings → 0 rows
--
-- 3) Owner listings
--    User A: insert own listing (status pending) → success via client
--    User A: select own pending listing → success
--    User B: select A pending listing → 0 rows
--    User A: update own approved listing via direct Supabase client → DENIED
--    User A: edit approved listing via My Listings UI (/api/my-listings) → pending
--
-- 4) Staff moderation
--    Admin: approve/reject in AdminPanel → success
--    Moderator: approve/reject in AdminPanel → success
--    Normal user: update someone else listing → DENIED
--
-- 5) Messages
--    Participant reads/sends → success
--    Non-participant read/send → DENIED
--
-- 6) Reports (listing_reports)
--    User creates report → success
--    User reads only own reports
--    Staff resolves report → success
--
-- 7) Storage
--    Upload to listings/{own_uid}/file.jpg → success
--    Upload to listings/{other_uid}/file.jpg → DENIED
--
-- 8) Regression smoke
--    Home search, listing detail, chat, favorites, seller page (/satici/[id])
--
-- ROLLBACK PLAN:
--    Restore policy export taken BEFORE migration (Section 2 of inventory script).
--    Do NOT guess — keep a pre-migration CSV export of pg_policies.
-- =============================================================================
