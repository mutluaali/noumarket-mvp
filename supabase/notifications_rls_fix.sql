-- Supabase SQL Editor içinde bir kez çalıştır.
-- Amaç: notifications tablosu yoksa oluşturmak ve RLS yüzünden sorgunun takılmasını engellemek.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  listing_id uuid null,
  type text default 'system',
  title text default 'Bildirim',
  body text,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Sistem/service role insert yapabilsin. Client tarafı insert gerekiyorsa ayrıca kontrollü policy eklenmeli.
create index if not exists idx_notifications_user_created
on public.notifications(user_id, created_at desc);
