# Production RLS Migration Runbook

**Migration file:** `sql/2026-05-29-rls-consolidation.sql` (patched with orphan policy drops)  
**Inventory script:** `sql/production-rls-inventory-readonly.sql`  
**Functional tests:** `scripts/rls-functional-verify.mjs`  
**Automated apply helper:** `scripts/rls-staging-apply-and-verify.mjs` (adapt env for production)

**Status:** Staging verified **21/21** with patched migration alone (no manual orphan cleanup).  
**Production:** **NOT APPLIED** — follow this runbook only during a controlled maintenance window.

---

## 0. Scope and safety rules

| Rule | Detail |
|------|--------|
| Apply only | `sql/2026-05-29-rls-consolidation.sql` |
| Do not run | Other SQL files, schema changes, or ad-hoc policy edits during the window |
| Do not deploy | Unrelated app changes (UI, pagination, filters, Stripe, premium) in the same window |
| Rollback reference | Pre-migration inventory export (CSV/JSON) — not automatic |
| Staging project (verified) | `pgrrdkuhdoiuqmzafilh` — **production ref will differ; confirm explicitly** |

---

## 1. Pre-flight checklist

Complete every item before the maintenance window. Assign an owner and timestamp for each.

### 1.1 Confirm production project

- [ ] Supabase Dashboard → correct **production** project selected (not staging/dev).
- [ ] Record production project ref: `________________________`
- [ ] Record production Supabase URL: `https://________.supabase.co`
- [ ] Confirm Vercel/hosting `NEXT_PUBLIC_SUPABASE_URL` points to this project.
- [ ] Confirm Stripe keys are **live** (if this is live production) — do not confuse with staging test keys.

### 1.2 Backup / export exists

- [ ] Supabase project backup or PITR window confirmed (Dashboard → Database → Backups).
- [ ] Pre-migration inventory exported and saved (Section 2).
- [ ] Inventory files stored outside the repo if they contain sensitive policy text:  
  `production-rls-inventory-YYYY-MM-DD-pre.*`
- [ ] Git tag or release SHA recorded for app code in production: `________________________`

### 1.3 Maintenance window

- [ ] Window scheduled: `________________________` (timezone: ________)
- [ ] Stakeholders notified (moderation, support, ops).
- [ ] Low-traffic period chosen (New Caledonia evening / early morning recommended).
- [ ] Rollback owner assigned: `________________________`
- [ ] Migration executor assigned: `________________________`
- [ ] Verification owner assigned: `________________________`

### 1.4 Test accounts (production or production-like)

Create or confirm these exist **before** migration:

| Account | Role | Purpose |
|---------|------|---------|
| Admin test user | `admin` in `profiles.role` | Approve/reject, report resolve |
| Moderator test user | `moderator` | Approve/reject |
| Normal user A | `user` | Owner listing tests |
| Normal user B | `user` | Cross-user denial tests |

Checklist:

- [ ] Admin can sign in to production app.
- [ ] Moderator can sign in to production app.
- [ ] Normal users A and B can sign in.
- [ ] **Do not** upsert `email` into `profiles` (column may not exist); set `role` only.
- [ ] Passwords stored in team secret manager (not committed to git).

### 1.5 Rollback reference inventory

- [ ] `sql/production-rls-inventory-readonly.sql` run on production **before** migration.
- [ ] Section 2 (all policies), Section 2b (duplicate counts), Section 3 (storage), Section 10 (NouMarket tables) exported.
- [ ] Expected pre-migration duplicates documented (staging baseline):

| Table | Command | Typical pre-count (staging baseline) |
|-------|---------|--------------------------------------|
| `listings` | SELECT | 6 |
| `listings` | UPDATE | 5 |
| `conversations` | SELECT / INSERT / UPDATE | 4 each |
| `messages` | SELECT / INSERT | 4 each |
| `profiles` | SELECT | 4 |
| `listing_images` | SELECT | 3 |
| `storage.objects` | INSERT | 4+ (bucket-wide + legacy names) |

Production counts may differ — **record actual production numbers**, do not assume staging parity.

---

## 2. Before migration — commands and steps

### 2.1 App health baseline (15 minutes before)

Run from a machine with production env (read-only checks only):

```bash
# Production site loads
curl -s -o /dev/null -w "%{http_code}" https://YOUR_PRODUCTION_DOMAIN/

# Optional: open app and confirm
# - Home shows approved listings
# - Listing detail opens
# - Sign-in works
# - Admin panel loads for admin user
```

Record baseline:

- [ ] Home HTTP status: ________
- [ ] Approved listings visible: yes / no
- [ ] Listing detail works: yes / no
- [ ] Auth sign-in works: yes / no
- [ ] Admin panel loads: yes / no

### 2.2 Export production inventory

**Option A — Supabase SQL Editor (recommended for audit trail)**

1. Dashboard → **production** project → SQL Editor.
2. Open `sql/production-rls-inventory-readonly.sql`.
3. Run **Section 0** (environment snapshot) — save result.
4. Run **Section 2** (all public policies) — export CSV.
5. Run **Section 2b** (duplicate policy counts) — export CSV.
6. Run **Section 3** + **Section 3b** (storage policies + buckets) — export CSV.
7. Run **Section 10** (NouMarket table policy counts) — export CSV.

**Option B — Postgres CLI (if production URI available)**

```bash
# Set production URI ONLY for this session — never commit
export PRODUCTION_DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-1-[region].pooler.supabase.com:5432/postgres"

# If direct db.* host fails (IPv6), use pooler URI from Dashboard → Database → Connection string
psql "$PRODUCTION_DATABASE_URL" -f sql/production-rls-inventory-readonly.sql -o production-rls-inventory-pre.txt
```

**Option C — Node helper (inventory + counts JSON)**

```bash
cd noumarket-mvp

# Temporarily set in shell ONLY (do not write password to repo):
# PRODUCTION_DATABASE_URL=...
# ALLOW_PRODUCTION_DATABASE=1

# Copy apply script pattern or run inventory queries manually via psql
```

Save files:

- [ ] `production-rls-inventory-pre-section02.csv`
- [ ] `production-rls-inventory-pre-section02b.csv`
- [ ] `production-rls-inventory-pre-storage.csv`
- [ ] `production-rls-inventory-pre-section10.csv`

### 2.3 Save policy counts (quick reference)

From Section 2b / Section 10, record production **before** counts:

```
Date/time: ________________________
Run as role: ______________________

listings SELECT:  ___
listings UPDATE:  ___
conversations SELECT/INSERT/UPDATE: ___ / ___ / ___
messages SELECT/INSERT/UPDATE: ___ / ___ / ___
profiles SELECT: ___
listing_images SELECT: ___
storage.objects policies (total): ___
```

### 2.4 Save storage policy state

From Section 3, confirm these legacy names exist pre-migration (check all that apply):

- [ ] `Authenticated users can upload`
- [ ] `Authenticated users can update`
- [ ] `Authenticated users can delete`
- [ ] `Public read access`
- [ ] `Authenticated users can upload listing images`
- [ ] Other: ________________________

Note: Patched migration drops all of the above plus canonical `nm_*` recreation.

---

## 3. Migration execution

### 3.1 Hard stops — do not proceed if

- Wrong Supabase project selected.
- Pre-migration inventory not saved.
- No backup/PITR confirmation.
- Active incident on production app unrelated to migration.

### 3.2 Apply patched migration only

**Option A — Supabase SQL Editor**

1. SQL Editor → New query.
2. Paste **entire** contents of `sql/2026-05-29-rls-consolidation.sql`.
3. Review file path and git SHA: `________________________`
4. Run once.
5. **Capture full output immediately** — screenshot or copy errors.

**Option B — Postgres CLI**

```bash
psql "$PRODUCTION_DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/2026-05-29-rls-consolidation.sql
```

**Option C — Node apply helper**

```bash
# Shell-only env — never commit production password
export PRODUCTION_DATABASE_URL="postgresql://..."
export ALLOW_PRODUCTION_DATABASE=1

# Adapt scripts/rls-staging-apply-and-verify.mjs to read PRODUCTION_DATABASE_URL
# OR run migration file via psql only (preferred for production audit simplicity)
```

### 3.3 During execution

- [ ] No other SQL tabs/queries running concurrently.
- [ ] Do not run unrelated migrations or `DROP TABLE`.
- [ ] If **any** error appears → **STOP** (Section 6 No-Go).
- [ ] Record start time: __________ end time: __________
- [ ] Record executor: __________

### 3.4 Expected immediate outcome

Migration is idempotent. On success:

- Legacy duplicate policies dropped (including orphan names patched in Section 7, 15, 15b).
- Canonical `nm_*` policies created.
- `is_platform_admin()` includes admin + moderator.
- Storage upload path-scoped to `listings/{auth.uid()}/...`.

---

## 4. Post-migration verification

Run in order. **Do not announce "done" until all critical checks pass.**

### 4.1 Re-run inventory

Repeat Section 2 export steps. Save as `production-rls-inventory-post-*`.

**Expected post-migration counts (from staging verification):**

| Table | Command | Expected |
|-------|---------|----------|
| `listings` | SELECT | **2** (`nm_listings_public_read`, `nm_listings_owner_read`) + staff via ALL |
| `listings` | UPDATE | **1** (`nm_listings_owner_update`) + staff via ALL |
| `conversations` | SELECT / INSERT / UPDATE | **1 each** (`nm_conversations_participant_*`) |
| `messages` | SELECT / INSERT / UPDATE | **1 each** (`nm_messages_participant_*`) |
| `profiles` | SELECT | **2** (`nm_profiles_select_own`, `nm_profiles_public_seller_read`) |
| `listing_images` | SELECT | **1** (`nm_listing_images_public_read`) |
| `storage.objects` | INSERT | **1** path-scoped (`nm_storage_listing_images_owner_insert`) + public read + staff ALL |

Storage must **not** retain bucket-wide `Authenticated users can upload/update/delete`.

### 4.2 Functional verification (automated)

From `noumarket-mvp/` with **production** Supabase anon/service keys in shell env (not staging `.env.local`):

```bash
# Point at production — use dedicated prod env file excluded from git
export NEXT_PUBLIC_SUPABASE_URL="https://PROD_REF.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
export NEXT_PUBLIC_APP_URL="https://YOUR_PRODUCTION_DOMAIN"

node scripts/rls-functional-verify.mjs
```

Expected: **`Summary: 21 passed, 0 failed, 21 total`**

Results written to `scripts/rls-functional-results.json`.

### 4.3 Five critical RLS checks (must all pass)

| # | Check | Automated test name |
|---|-------|---------------------|
| 1 | User B cannot read User A pending listing | `Owner cannot read another user pending listing` |
| 2 | Owner cannot client-update approved listing | `Owner cannot client-update approved listing` |
| 3 | Normal user cannot approve another user's listing | `Normal user cannot approve another user listing` |
| 4 | Non-participant cannot read messages | `Non-participant cannot read messages` |
| 5 | Cross-user storage upload denied | `User cannot upload to listings/{other_uid}/...` |

If any fail → **NO-GO** (Section 6).

### 4.4 Manual smoke tests (production app)

| Flow | Steps | Pass |
|------|-------|------|
| Listing create | User A → İlan Ver → submit pending listing | [ ] |
| Listing edit | User A → My Listings → edit approved via UI → returns to pending | [ ] |
| Admin approve | Admin → AdminPanel → approve pending listing | [ ] |
| Admin reject | Admin → reject with reason (if column exists) | [ ] |
| Moderator approve | Moderator → approve listing | [ ] |
| Chat | User B messages seller on approved listing | [ ] |
| Image upload own path | User A uploads photo on create listing | [ ] |
| Image upload denied | (covered by automated test) cross-user path blocked | [ ] |
| Public browse | Anonymous / logged-out home shows approved listings only | [ ] |

### 4.5 Compare before vs after

- [ ] `listings` SELECT count decreased from ~6 to **2** (+ ALL staff).
- [ ] `listings` UPDATE count decreased from ~5 to **1** (+ ALL staff).
- [ ] No legacy storage bucket-wide upload policy remains.
- [ ] No duplicate conversation/message policy names remain (only `nm_*`).

---

## 5. Rollback strategy

### 5.1 What can be rolled back

| Item | Rollback method |
|------|-----------------|
| RLS policies | Recreate from **pre-migration inventory export** (manual SQL) |
| `is_platform_admin()` function | Restore from inventory Section 4b export |
| Storage policies | Restore from Section 3 export |
| App code | Redeploy previous Vercel deployment (unaffected by this migration) |

### 5.2 What cannot be automatically rolled back

- Supabase does not auto-revert RLS from a single button.
- There is **no** down-migration file — rollback is **forward SQL** that recreates old policies from the pre-export.
- Data changes during the window (listings, messages) are **not** reverted by policy rollback.

### 5.3 Safest rollback path if critical flows fail

1. **STOP** user traffic messaging if severe (optional maintenance banner).
2. Open pre-migration inventory CSV (Section 2 export).
3. For each dropped policy in the export, run `CREATE POLICY ...` with exact `using` / `with_check` from export.  
   **Do not guess policy text** — use exported definitions only.
4. Alternatively: restore database from Supabase backup/PITR to timestamp **before** migration (last resort — loses window data).
5. Re-run inventory to confirm restored state matches pre-export.
6. Re-run smoke tests (home, create listing, admin approve).
7. Post incident note: which check failed, which policies restored, whether PITR used.

### 5.4 Partial failure scenarios

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Storage upload fails for all users | Orphan bucket policy still present OR path wrong | Check Section 3 post-inventory; re-apply migration Section 15 only if approved |
| Admin cannot moderate | `profiles.role` or `is_platform_admin` | Verify admin/moderator profiles; check `nm_listings_staff_all` exists |
| My Listings edit fails | API/service role (not RLS) | Check `/api/my-listings/[id]` logs — do not rollback RLS blindly |
| Chat broken | Conversation policies missing | Verify `nm_conversations_*` / `nm_messages_*` exist |

---

## 6. Go / no-go decision criteria

### 6.1 GO — production is safe when **ALL** true

- [ ] Migration completed with **zero SQL errors**.
- [ ] Post-migration inventory matches expected canonical counts (Section 4.1).
- [ ] `scripts/rls-functional-verify.mjs` → **21/21 passed** against production.
- [ ] All **5 critical RLS checks** passed.
- [ ] Manual smoke tests passed (Section 4.4).
- [ ] No elevated error rate in app logs for 15–30 minutes post-window.
- [ ] Rollback owner confirms pre-migration export is archived.

**Decision:** GO — close maintenance window.  
**Signed:** __________ **Date:** __________

### 6.2 NO-GO — stop and do not declare success if **ANY** true

- Migration SQL error (capture exact message: `________________________`).
- Post-inventory shows legacy bucket-wide storage upload policy still present.
- Functional verify **< 21/21** or any critical check failed.
- Admin or moderator cannot approve/reject listings.
- Normal users cannot create listings or upload own images.
- Cross-user pending listing read succeeds (security regression).
- Cross-user storage upload succeeds (security regression).
- Unexpected production outage correlated with migration start time.

**Decision:** NO-GO — execute rollback strategy (Section 5.3).  
**Signed:** __________ **Date:** __________

---

## 7. Final report template

Copy and complete after the maintenance window.

```markdown
# Production RLS Migration Report

## Summary
- Date/time (UTC): 
- Maintenance window: 
- Production project ref: 
- Migration file: sql/2026-05-29-rls-consolidation.sql @ git SHA: 
- Decision: GO / NO-GO

## Executors
- Migration: 
- Verification: 
- Rollback owner: 

## Pre-migration
- Inventory exported: yes / no — path: 
- listings SELECT count (before): 
- listings UPDATE count (before): 
- storage orphan policies present: yes / no — list: 
- App health baseline: pass / fail — notes: 

## Migration execution
- Start / end time: 
- SQL errors: none / describe: 
- Method: SQL Editor / psql / other

## Post-migration inventory
- listings SELECT: 
- listings UPDATE: 
- conversations (S/I/U): 
- messages (S/I/U): 
- storage path-scoped upload only: yes / no
- Orphan policies remaining: none / list: 

## Functional verification
- scripts/rls-functional-verify.mjs: ___ / 21 passed
- Failed tests (if any): 

## Critical RLS checks
1. Cross-user pending read blocked: pass / fail
2. Client update approved blocked: pass / fail
3. User escalation blocked: pass / fail
4. Non-participant message read blocked: pass / fail
5. Cross-user storage upload blocked: pass / fail

## Manual smoke
- Listing create: pass / fail
- My Listings edit → pending: pass / fail
- Admin approve/reject: pass / fail
- Moderator approve: pass / fail
- Chat: pass / fail
- Own-path image upload: pass / fail

## Rollback
- Rollback required: yes / no
- Rollback method: policy restore from export / PITR / none
- Rollback outcome: 

## Follow-ups
- [ ] Archive pre/post inventory in secure storage
- [ ] Update team runbook if production counts differed from staging
- [ ] Schedule post-window monitoring review (24h)

## Sign-off
Production RLS migration complete and verified: yes / no
Name: __________ Date: __________
```

---

## Appendix A — Staging reference (do not copy ref to production blindly)

| Item | Staging value |
|------|----------------|
| Project ref | `pgrrdkuhdoiuqmzafilh` |
| Migration result | 21/21 functional tests |
| Pooler region (if direct DB host fails) | `aws-1-ap-south-1.pooler.supabase.com:5432` |
| Orphan names patched in migration | See `sql/2026-05-29-rls-consolidation.sql` Sections 7, 15, 15b |

## Appendix B — Related repo files

| File | Purpose |
|------|---------|
| `sql/2026-05-29-rls-consolidation.sql` | Patched migration (apply this only) |
| `sql/production-rls-inventory-readonly.sql` | Read-only inventory |
| `scripts/rls-functional-verify.mjs` | 21 automated RLS tests |
| `scripts/rls-staging-apply-and-verify.mjs` | Staging apply + inventory helper |
| `scripts/rls-inventory-before.json` | Example pre-migration snapshot (staging) |
| `scripts/rls-inventory-after.json` | Example post-migration snapshot (staging) |

---

**Document version:** 2026-05-29  
**Production apply status:** NOT APPLIED — runbook only
