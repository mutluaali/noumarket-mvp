-- NouMarket V17 production hotfix
-- Amaç: production'da profil modalı ve mesajlar modali için eksik kolon/RLS/realtime uyumluluğunu sağlamlaştırmak.

-- 1) Profil şeması güvenli kolonlar
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists store_name text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz;

-- role enum/text karışıklığı olan eski kurulumları kırmadan bırakıyoruz; sadece policy'leri sadeleştiriyoruz.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
drop policy if exists "profiles owner select" on public.profiles;
drop policy if exists "profiles owner insert" on public.profiles;
drop policy if exists "profiles owner update" on public.profiles;

create policy "profiles owner select"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles owner insert"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles owner update"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- 2) Mesaj şeması güvenli kolonlar
alter table public.conversations add column if not exists created_at timestamptz not null default now();
alter table public.conversations add column if not exists updated_at timestamptz not null default now();
alter table public.messages add column if not exists read_at timestamptz;
alter table public.messages add column if not exists is_read boolean not null default false;

create index if not exists conversations_buyer_idx on public.conversations(buyer_id);
create index if not exists conversations_seller_idx on public.conversations(seller_id);
create index if not exists conversations_listing_idx on public.conversations(listing_id);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Conversation policies
drop policy if exists "participants can read conversations" on public.conversations;
drop policy if exists "participants can create conversations" on public.conversations;
drop policy if exists "participants can update conversations" on public.conversations;

create policy "participants can read conversations"
on public.conversations
for select
to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "participants can create conversations"
on public.conversations
for insert
to authenticated
with check (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "participants can update conversations"
on public.conversations
for update
to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid())
with check (buyer_id = auth.uid() or seller_id = auth.uid());

-- Message policies
drop policy if exists "participants can read messages" on public.messages;
drop policy if exists "participants can send messages" on public.messages;
drop policy if exists "participants can mark messages read" on public.messages;

create policy "participants can read messages"
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

create policy "participants can send messages"
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

create policy "participants can mark messages read"
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

-- 3) Realtime publication: tekrar çalıştırılabilir güvenli blok
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
