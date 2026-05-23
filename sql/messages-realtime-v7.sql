-- NouMarket V7 - Realtime messages and read receipts
-- Run this once in Supabase SQL Editor after the core schema.

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create index if not exists conversations_buyer_idx on public.conversations(buyer_id);
create index if not exists conversations_seller_idx on public.conversations(seller_id);
create index if not exists conversations_updated_at_idx on public.conversations(updated_at desc);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at asc);
create index if not exists messages_unread_idx on public.messages(conversation_id, sender_id, read_at);

drop policy if exists "participants can mark messages read" on public.messages;

create policy "participants can mark messages read"
on public.messages
for update
to authenticated
using (
  sender_id <> auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
)
with check (
  sender_id <> auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

create or replace function public.update_conversation_timestamp()
returns trigger as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_message_created_update_conversation on public.messages;

create trigger on_message_created_update_conversation
after insert on public.messages
for each row execute procedure public.update_conversation_timestamp();

-- Required for Supabase Realtime postgres_changes subscriptions.
do $$
begin
  alter publication supabase_realtime add table public.conversations;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
