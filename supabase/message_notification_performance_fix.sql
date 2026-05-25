-- NouMarket mesaj + bildirim bağlantı düzeltmesi
-- Amaç: RLS yüzünden kullanıcı tarafında takılan sorguları hızlandırmak ve güvenli hale getirmek.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  message text,
  body text,
  type text default 'system',
  is_read boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
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

create index if not exists idx_notifications_user_read_created
on public.notifications(user_id, is_read, created_at desc);

create index if not exists idx_notifications_user_created
on public.notifications(user_id, created_at desc);

-- Mesajlaşma tabloları mevcutsa RLS ve indexleri düzenle.
do $$
begin
  if to_regclass('public.conversations') is not null then
    alter table public.conversations enable row level security;

    drop policy if exists "Users can read own conversations" on public.conversations;
    create policy "Users can read own conversations"
    on public.conversations
    for select
    to authenticated
    using (auth.uid() = buyer_id or auth.uid() = seller_id);

    drop policy if exists "Users can insert own conversations" on public.conversations;
    create policy "Users can insert own conversations"
    on public.conversations
    for insert
    to authenticated
    with check (auth.uid() = buyer_id or auth.uid() = seller_id);
  end if;

  if to_regclass('public.messages') is not null then
    alter table public.messages enable row level security;

    drop policy if exists "Users can read messages in own conversations" on public.messages;
    create policy "Users can read messages in own conversations"
    on public.messages
    for select
    to authenticated
    using (
      exists (
        select 1 from public.conversations c
        where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
      )
    );

    drop policy if exists "Users can insert messages in own conversations" on public.messages;
    create policy "Users can insert messages in own conversations"
    on public.messages
    for insert
    to authenticated
    with check (
      sender_id = auth.uid()
      and exists (
        select 1 from public.conversations c
        where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
      )
    );

    drop policy if exists "Users can update read state in own conversations" on public.messages;
    create policy "Users can update read state in own conversations"
    on public.messages
    for update
    to authenticated
    using (
      exists (
        select 1 from public.conversations c
        where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
      )
    )
    with check (
      exists (
        select 1 from public.conversations c
        where c.id = messages.conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
      )
    );
  end if;
end $$;

create index if not exists idx_conversations_buyer_updated
on public.conversations(buyer_id, updated_at desc);

create index if not exists idx_conversations_seller_updated
on public.conversations(seller_id, updated_at desc);

create index if not exists idx_messages_conversation_created
on public.messages(conversation_id, created_at desc);

create index if not exists idx_messages_conversation_sender
on public.messages(conversation_id, sender_id);
