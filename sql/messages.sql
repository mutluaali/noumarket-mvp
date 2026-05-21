create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  buyer_id uuid references auth.users(id) on delete cascade,
  seller_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (listing_id, buyer_id, seller_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table conversations enable row level security;
alter table messages enable row level security;

drop policy if exists "participants can read conversations" on conversations;
drop policy if exists "buyers can create conversations" on conversations;
drop policy if exists "participants can update conversations" on conversations;
drop policy if exists "participants can read messages" on messages;
drop policy if exists "participants can send messages" on messages;

create policy "participants can read conversations"
on conversations
for select
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "buyers can create conversations"
on conversations
for insert
to authenticated
with check (auth.uid() = buyer_id);

create policy "participants can update conversations"
on conversations
for update
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "participants can read messages"
on messages
for select
to authenticated
using (
  exists (
    select 1 from conversations
    where conversations.id = messages.conversation_id
    and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())
  )
);

create policy "participants can send messages"
on messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from conversations
    where conversations.id = messages.conversation_id
    and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())
  )
);

create or replace function update_conversation_timestamp()
returns trigger as $$
begin
  update conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_message_created_update_conversation on messages;

create trigger on_message_created_update_conversation
after insert on messages
for each row execute procedure update_conversation_timestamp();
