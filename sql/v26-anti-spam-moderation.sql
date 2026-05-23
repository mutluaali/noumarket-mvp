-- V26 Anti-spam, moderation quality and audit hardening

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  listing_id uuid references public.listings(id) on delete cascade,
  action text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.moderation_actions enable row level security;

drop policy if exists "Admins can read moderation actions" on public.moderation_actions;
create policy "Admins can read moderation actions"
on public.moderation_actions
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'admin'
  )
);

drop policy if exists "Admins can insert moderation actions" on public.moderation_actions;
create policy "Admins can insert moderation actions"
on public.moderation_actions
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'admin'
  )
);

create index if not exists moderation_actions_listing_idx on public.moderation_actions(listing_id);
create index if not exists moderation_actions_created_idx on public.moderation_actions(created_at desc);
create index if not exists listings_metadata_gin_idx on public.listings using gin(metadata);

-- Lightweight duplicate detection helper. It does not block inserts; it gives admins a signal.
create or replace function public.find_possible_duplicate_listings(target_listing_id uuid)
returns table (
  id uuid,
  title text,
  seller_phone text,
  created_at timestamptz,
  similarity_hint text
)
language sql
security definer
set search_path = public
as $$
  select l2.id, l2.title, l2.seller_phone, l2.created_at,
    case
      when lower(coalesce(l1.title, '')) = lower(coalesce(l2.title, '')) then 'same_title'
      when coalesce(l1.seller_phone, '') <> '' and l1.seller_phone = l2.seller_phone then 'same_phone'
      else 'similar'
    end as similarity_hint
  from public.listings l1
  join public.listings l2 on l2.id <> l1.id
  where l1.id = target_listing_id
    and l2.created_at > now() - interval '45 days'
    and (
      lower(coalesce(l1.title, '')) = lower(coalesce(l2.title, ''))
      or (coalesce(l1.seller_phone, '') <> '' and l1.seller_phone = l2.seller_phone)
    )
  order by l2.created_at desc
  limit 20;
$$;

-- Optional view for quick admin inspection in Supabase.
create or replace view public.admin_moderation_queue as
select
  id,
  title,
  category,
  location,
  price,
  status,
  metadata ->> 'moderation_status' as moderation_status,
  (metadata ->> 'moderation_risk_score')::int as moderation_risk_score,
  created_at,
  updated_at
from public.listings
where status in ('pending', 'approved')
order by coalesce((metadata ->> 'moderation_risk_score')::int, 0) desc, created_at desc;
