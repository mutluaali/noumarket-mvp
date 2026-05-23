-- V24 - Beta feedback and bug reporting
create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null default 'feedback' check (type in ('bug', 'idea', 'feedback')),
  severity text not null default 'normal' check (severity in ('low', 'normal', 'high', 'critical')),
  message text not null,
  page_url text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'closed')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_reports_created_at_idx on public.feedback_reports(created_at desc);
create index if not exists feedback_reports_status_idx on public.feedback_reports(status);
create index if not exists feedback_reports_user_id_idx on public.feedback_reports(user_id);

alter table public.feedback_reports enable row level security;

drop policy if exists feedback_reports_insert_own_or_guest on public.feedback_reports;
create policy feedback_reports_insert_own_or_guest on public.feedback_reports
for insert to anon, authenticated
with check (user_id is null or user_id = auth.uid());

drop policy if exists feedback_reports_admin_read on public.feedback_reports;
create policy feedback_reports_admin_read on public.feedback_reports
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists feedback_reports_admin_update on public.feedback_reports;
create policy feedback_reports_admin_update on public.feedback_reports
for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
