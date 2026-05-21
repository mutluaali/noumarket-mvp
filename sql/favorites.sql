create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

alter table favorites enable row level security;

drop policy if exists "Users can read own favorites" on favorites;
create policy "Users can read own favorites"
on favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can add own favorites" on favorites;
create policy "Users can add own favorites"
on favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on favorites;
create policy "Users can delete own favorites"
on favorites
for delete
to authenticated
using (auth.uid() = user_id);
