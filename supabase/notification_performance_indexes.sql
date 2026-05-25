-- NouMarket notification performance fix
-- Supabase SQL Editor'da bir kez çalıştır.

create index if not exists notifications_user_unread_idx
on public.notifications(user_id, is_read, created_at desc);

create index if not exists notifications_user_created_idx
on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'Users can view own notifications'
  ) then
    create policy "Users can view own notifications"
    on public.notifications
    for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'Users can update own notifications'
  ) then
    create policy "Users can update own notifications"
    on public.notifications
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end $$;
