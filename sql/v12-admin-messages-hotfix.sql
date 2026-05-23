-- NouMarket V12 hotfix - admin dashboard + messages compatibility
-- Supabase SQL Editor'da bir kez çalıştır.

-- Eski profil şemasında store_name yoksa admin panel hata vermesin diye kolon eklenir.
alter table public.profiles add column if not exists store_name text;

-- Mesaj okundu bilgisi için yeni kolon. Eski is_read alanı korunur.
alter table public.messages add column if not exists read_at timestamptz;
alter table public.messages add column if not exists is_read boolean not null default false;

create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at desc);
create index if not exists messages_read_at_idx on public.messages(conversation_id, read_at);

-- RLS update policy çakışmasız yenilenir.
drop policy if exists "participants can mark messages read" on public.messages;
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
