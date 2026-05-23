-- NouMarket V14 - Saved searches, price drop alerts and notification retention layer
-- Safe to run more than once.

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Kayıtlı arama',
  query text,
  category text default 'Tümü',
  location text default 'Tümü',
  min_price numeric,
  max_price numeric,
  sort text default 'newest',
  notify_new_matches boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saved_searches enable row level security;

create index if not exists saved_searches_user_id_idx on public.saved_searches(user_id);
create index if not exists saved_searches_notify_idx on public.saved_searches(notify_new_matches) where notify_new_matches = true;
create index if not exists saved_searches_category_location_idx on public.saved_searches(category, location);

alter table public.notifications add column if not exists type text default 'general';
alter table public.notifications add column if not exists title text;
alter table public.notifications add column if not exists body text;
alter table public.notifications add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.notifications add column if not exists is_read boolean not null default false;
alter table public.notifications add column if not exists created_at timestamptz not null default now();

-- Policy cleanup for repeatable migrations
drop policy if exists saved_searches_select_own on public.saved_searches;
drop policy if exists saved_searches_insert_own on public.saved_searches;
drop policy if exists saved_searches_update_own on public.saved_searches;
drop policy if exists saved_searches_delete_own on public.saved_searches;

create policy saved_searches_select_own on public.saved_searches
for select to authenticated
using (auth.uid() = user_id);

create policy saved_searches_insert_own on public.saved_searches
for insert to authenticated
with check (auth.uid() = user_id);

create policy saved_searches_update_own on public.saved_searches
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy saved_searches_delete_own on public.saved_searches
for delete to authenticated
using (auth.uid() = user_id);

create or replace function public.touch_saved_searches_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_saved_searches_touch_updated_at on public.saved_searches;
create trigger trg_saved_searches_touch_updated_at
before update on public.saved_searches
for each row execute function public.touch_saved_searches_updated_at();

create or replace function public.notify_saved_search_matches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  search_row record;
  normalized_query text;
begin
  if new.status is distinct from 'approved' then
    return new;
  end if;

  for search_row in
    select * from public.saved_searches
    where notify_new_matches = true
      and user_id is distinct from new.user_id
      and (category is null or category = '' or category = 'Tümü' or category = new.category)
      and (location is null or location = '' or location = 'Tümü' or location = new.location)
      and (min_price is null or coalesce(new.price, 0) >= min_price)
      and (max_price is null or coalesce(new.price, 0) <= max_price)
  loop
    normalized_query := lower(coalesce(search_row.query, ''));

    if normalized_query <> '' and position(normalized_query in lower(coalesce(new.title, '') || ' ' || coalesce(new.description, ''))) = 0 then
      continue;
    end if;

    if not exists (
      select 1 from public.notifications n
      where n.user_id = search_row.user_id
        and n.type = 'saved_search_match'
        and coalesce(n.metadata->>'listing_id', '') = new.id::text
        and coalesce(n.metadata->>'saved_search_id', '') = search_row.id::text
    ) then
      insert into public.notifications (user_id, type, title, body, metadata, is_read)
      values (
        search_row.user_id,
        'saved_search_match',
        'Kayıtlı aramana uygun yeni ilan',
        coalesce(new.title, 'Yeni ilan') || ' aramana uygun görünüyor.',
        jsonb_build_object('listing_id', new.id, 'saved_search_id', search_row.id, 'category', new.category, 'location', new.location),
        false
      );

      update public.saved_searches
      set last_notified_at = now()
      where id = search_row.id;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_saved_search_matches_on_listing on public.listings;
create trigger trg_saved_search_matches_on_listing
after insert or update of status, title, description, category, location, price on public.listings
for each row execute function public.notify_saved_search_matches();

create or replace function public.notify_favorite_price_drop()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  favorite_row record;
begin
  if old.price is null or new.price is null then
    return new;
  end if;

  if new.status is distinct from 'approved' then
    return new;
  end if;

  if new.price >= old.price then
    return new;
  end if;

  for favorite_row in
    select user_id from public.favorites
    where listing_id = new.id
      and user_id is distinct from new.user_id
  loop
    if not exists (
      select 1 from public.notifications n
      where n.user_id = favorite_row.user_id
        and n.type = 'favorite_price_drop'
        and coalesce(n.metadata->>'listing_id', '') = new.id::text
        and coalesce(n.metadata->>'new_price', '') = new.price::text
    ) then
      insert into public.notifications (user_id, type, title, body, metadata, is_read)
      values (
        favorite_row.user_id,
        'favorite_price_drop',
        'Favori ilanda fiyat düştü',
        coalesce(new.title, 'Favorindeki ilan') || ' için fiyat ' || coalesce(new.price::text, '') || ' XPF oldu.',
        jsonb_build_object('listing_id', new.id, 'old_price', old.price, 'new_price', new.price),
        false
      );
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_favorite_price_drop_on_listing on public.listings;
create trigger trg_favorite_price_drop_on_listing
after update of price, status on public.listings
for each row execute function public.notify_favorite_price_drop();
