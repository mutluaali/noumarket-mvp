create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on audit_logs;
create policy "Admins can read audit logs"
on audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can create audit logs" on audit_logs;
create policy "Admins can create audit logs"
on audit_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);