-- =============================================================================
-- NouMarket — Production RLS Inventory (READ ONLY)
-- =============================================================================
-- Purpose: Collect active RLS policies, helper functions, storage rules,
--          listing triggers, and moderation-related objects for review.
--
-- Safety:
--   * SELECT / catalog queries only — no DDL, no DML, no grants changes.
--   * Safe to run in Supabase SQL Editor on production.
--
-- How to run:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file (or run section by section)
--   3. Export each result grid as CSV (see docs at bottom of this file)
--
-- Recommended: run with a read-only role if your org provides one.
-- Default Supabase SQL Editor uses sufficient catalog access for these views.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- SECTION 0 — Environment snapshot (context for the export)
-- -----------------------------------------------------------------------------
SELECT
  current_database() AS database_name,
  current_user AS run_as_role,
  now() AT TIME ZONE 'utc' AS captured_at_utc,
  version() AS postgres_version;


-- -----------------------------------------------------------------------------
-- SECTION 1 — All RLS-enabled tables (public + storage)
-- -----------------------------------------------------------------------------
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname IN ('public', 'storage')
  AND c.relrowsecurity = true
ORDER BY n.nspname, c.relname;


-- -----------------------------------------------------------------------------
-- SECTION 2 — All active RLS policies (public schema)
-- Includes policy definition text from pg_policies catalog view.
-- -----------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname, cmd;


-- -----------------------------------------------------------------------------
-- SECTION 2b — Policy count per table (quick duplicate detector)
-- -----------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  cmd AS command,
  count(*) AS policy_count,
  array_agg(policyname ORDER BY policyname) AS policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename, cmd
HAVING count(*) > 1
ORDER BY policy_count DESC, tablename, cmd;


-- -----------------------------------------------------------------------------
-- SECTION 3 — Storage bucket policies (storage.objects)
-- -----------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname, cmd;


-- -----------------------------------------------------------------------------
-- SECTION 3b — Storage buckets configuration
-- -----------------------------------------------------------------------------
SELECT
  id AS bucket_id,
  name AS bucket_name,
  public AS is_public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets
ORDER BY name;


-- -----------------------------------------------------------------------------
-- SECTION 4 — Admin / platform helper functions
-- Matches common NouMarket helper names and role-check patterns.
-- -----------------------------------------------------------------------------
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  p.prosecdef AS security_definer,
  pg_get_userbyid(p.proowner) AS owner,
  l.lanname AS language
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
  AND (
    p.proname IN (
      'is_admin',
      'is_platform_admin',
      'activate_listing_premium',
      'expire_old_premium_listings',
      'set_phone_verified',
      'find_possible_duplicate_listings'
    )
    OR p.proname ILIKE '%admin%'
    OR p.proname ILIKE '%moderation%'
    OR p.proname ILIKE '%moderator%'
  )
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);


-- -----------------------------------------------------------------------------
-- SECTION 4b — Full source for admin helper functions (review overloads)
-- -----------------------------------------------------------------------------
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'is_platform_admin')
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);


-- -----------------------------------------------------------------------------
-- SECTION 5 — Moderation-related tables (existence + RLS flag)
-- -----------------------------------------------------------------------------
SELECT
  t.table_schema,
  t.table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND (
    t.table_name ILIKE '%moder%'
    OR t.table_name IN (
      'listing_reports',
      'reports',
      'audit_logs',
      'moderation_logs',
      'moderation_actions'
    )
  )
ORDER BY t.table_name;


-- -----------------------------------------------------------------------------
-- SECTION 5b — Policies on moderation / report tables only
-- -----------------------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  cmd AS command,
  roles,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'listing_reports',
    'reports',
    'audit_logs',
    'moderation_logs',
    'moderation_actions'
  )
ORDER BY tablename, policyname;


-- -----------------------------------------------------------------------------
-- SECTION 6 — Functions related to moderation (definitions)
-- -----------------------------------------------------------------------------
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    p.proname ILIKE '%moder%'
    OR p.proname ILIKE '%report%'
    OR p.proname ILIKE '%audit%'
    OR p.proname ILIKE '%spam%'
    OR p.proname ILIKE '%duplicate%listing%'
    OR p.proname IN ('find_possible_duplicate_listings')
  )
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);


-- -----------------------------------------------------------------------------
-- SECTION 7 — Triggers on listings + listing_images
-- -----------------------------------------------------------------------------
SELECT
  event_object_schema AS schema_name,
  event_object_table AS table_name,
  trigger_name,
  action_timing,
  event_manipulation AS event,
  action_orientation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('listings', 'listing_images')
ORDER BY event_object_table, trigger_name, event_manipulation;


-- -----------------------------------------------------------------------------
-- SECTION 7b — All triggers that reference listings (functions, notifications)
-- Captures triggers on other tables whose function body mentions listings.
-- -----------------------------------------------------------------------------
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
  AND n.nspname = 'public'
  AND (
    c.relname IN ('listings', 'listing_images', 'notifications', 'profiles')
    OR pg_get_functiondef(p.oid) ILIKE '%listings%'
  )
ORDER BY c.relname, t.tgname;


-- -----------------------------------------------------------------------------
-- SECTION 8 — Listings table: columns relevant to moderation workflow
-- -----------------------------------------------------------------------------
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'listings'
  AND column_name IN (
    'status',
    'approval_status',
    'approved_at',
    'rejected_reason',
    'expires_at',
    'is_featured',
    'featured_until',
    'user_id',
    'updated_at'
  )
ORDER BY column_name;


-- -----------------------------------------------------------------------------
-- SECTION 9 — Profiles roles present in production (admin/moderator audit)
-- Read-only aggregate; no PII beyond role counts.
-- -----------------------------------------------------------------------------
SELECT
  coalesce(role::text, '<null>') AS role,
  count(*) AS profile_count
FROM public.profiles
GROUP BY role
ORDER BY profile_count DESC;


-- -----------------------------------------------------------------------------
-- SECTION 10 — Duplicate policy name patterns on listings (NouMarket-specific)
-- Flags tables where multiple SELECT/UPDATE policies may overlap.
-- -----------------------------------------------------------------------------
SELECT
  tablename,
  cmd AS command,
  count(*) AS policy_count,
  string_agg(policyname, ' | ' ORDER BY policyname) AS policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('listings', 'listing_images', 'profiles', 'messages', 'conversations', 'listing_reports')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;


-- -----------------------------------------------------------------------------
-- EXPORT NOTES (not executed)
-- -----------------------------------------------------------------------------
-- Supabase SQL Editor:
--   1. Run one section at a time (highlight → Run)
--   2. Results grid → Download CSV (or copy)
--   3. Name files: rls-inventory-section-02-policies.csv, etc.
--
-- For a single JSON archive, copy results into a spreadsheet or use psql:
--   psql "$DATABASE_URL" -f production-rls-inventory-readonly.sql -o inventory.txt
--
-- Compare export against repo SQL files in sql/ to find drift.
-- =============================================================================
