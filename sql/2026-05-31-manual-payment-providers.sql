-- NouMarket — Bank transfer & EpayNC payment order fields (idempotent)

alter table if exists public.payment_orders
  add column if not exists reference text,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists payment_instructions jsonb,
  add column if not exists provider_reference text;

create unique index if not exists idx_payment_orders_reference
  on public.payment_orders (reference)
  where reference is not null;

create index if not exists idx_payment_orders_pending_review
  on public.payment_orders (status, created_at desc)
  where status in ('pending_manual_review', 'pending_external_payment');

comment on column public.payment_orders.reference is 'User-facing payment reference, e.g. NM-2026-000123';
