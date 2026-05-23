-- NouMarket V27 - Mobile notification center
-- Migration-safe. Supabase SQL Editor içinde çalıştır.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  body text,
  listing_id uuid references public.listings(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications
  add column if not exists action_url text,
  add column if not exists priority text not null default 'normal',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists notifications_user_read_created_idx
on public.notifications(user_id, is_read, created_at desc);

create index if not exists notifications_type_idx
on public.notifications(type);

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

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
on public.notifications
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own notifications" on public.notifications;
create policy "Users can create own notifications"
on public.notifications
for insert
to authenticated
with check (auth.uid() = user_id);

create or replace function public.notify_listing_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    if new.status = 'approved' then
      insert into public.notifications (user_id, type, title, body, listing_id, action_url, priority)
      values (new.user_id, 'listing_approved', 'İlanın onaylandı', coalesce(new.title, 'İlan') || ' yayına alındı.', new.id, '/ilan/' || new.id::text, 'high');
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, type, title, body, listing_id, action_url, priority)
      values (new.user_id, 'listing_rejected', 'İlanın reddedildi', coalesce(new.title, 'İlan') || ' admin tarafından reddedildi.', new.id, '/ilan/' || new.id::text, 'high');
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trigger_notify_listing_status_change on public.listings;
create trigger trigger_notify_listing_status_change
after update of status on public.listings
for each row
execute procedure public.notify_listing_status_change();

create or replace function public.notify_new_message()
returns trigger as $$
declare
  receiver uuid;
  listing_title text;
begin
  select
    case when c.buyer_id = new.sender_id then c.seller_id else c.buyer_id end,
    l.title
  into receiver, listing_title
  from public.conversations c
  left join public.listings l on l.id = c.listing_id
  where c.id = new.conversation_id;

  if receiver is not null then
    insert into public.notifications (user_id, type, title, body, conversation_id, action_url, priority)
    values (receiver, 'new_message', 'Yeni mesaj', coalesce(listing_title, 'İlan') || ' için yeni mesaj aldın.', new.conversation_id, '/', 'high');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trigger_notify_new_message on public.messages;
create trigger trigger_notify_new_message
after insert on public.messages
for each row
execute procedure public.notify_new_message();
