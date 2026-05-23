-- NouMarket V38-V42 bulk growth migration

create table if not exists public.seller_reviews (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(seller_id, buyer_id)
);

create index if not exists seller_reviews_seller_id_idx on public.seller_reviews(seller_id);

alter table public.seller_reviews enable row level security;

drop policy if exists "seller reviews are readable" on public.seller_reviews;
create policy "seller reviews are readable" on public.seller_reviews for select using (true);

drop policy if exists "buyers can insert own seller reviews" on public.seller_reviews;
create policy "buyers can insert own seller reviews" on public.seller_reviews for insert with check (auth.uid() = buyer_id and auth.uid() <> seller_id);

drop policy if exists "buyers can update own seller reviews" on public.seller_reviews;
create policy "buyers can update own seller reviews" on public.seller_reviews for update using (auth.uid() = buyer_id) with check (auth.uid() = buyer_id);

create table if not exists public.seller_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, seller_id)
);

create index if not exists seller_follows_user_id_idx on public.seller_follows(user_id);
create index if not exists seller_follows_seller_id_idx on public.seller_follows(seller_id);

alter table public.seller_follows enable row level security;

drop policy if exists "users can read own seller follows" on public.seller_follows;
create policy "users can read own seller follows" on public.seller_follows for select using (auth.uid() = user_id);

drop policy if exists "users can follow sellers" on public.seller_follows;
create policy "users can follow sellers" on public.seller_follows for insert with check (auth.uid() = user_id and auth.uid() <> seller_id);

drop policy if exists "users can unfollow sellers" on public.seller_follows;
create policy "users can unfollow sellers" on public.seller_follows for delete using (auth.uid() = user_id);

create table if not exists public.price_watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  original_price numeric,
  last_seen_price numeric,
  created_at timestamptz not null default now(),
  unique(user_id, listing_id)
);

create index if not exists price_watches_user_id_idx on public.price_watches(user_id);
create index if not exists price_watches_listing_id_idx on public.price_watches(listing_id);

alter table public.price_watches enable row level security;

drop policy if exists "users can read own price watches" on public.price_watches;
create policy "users can read own price watches" on public.price_watches for select using (auth.uid() = user_id);

drop policy if exists "users can create own price watches" on public.price_watches;
create policy "users can create own price watches" on public.price_watches for insert with check (auth.uid() = user_id);

drop policy if exists "users can delete own price watches" on public.price_watches;
create policy "users can delete own price watches" on public.price_watches for delete using (auth.uid() = user_id);

-- Optional profile aggregates. Safe for existing DBs.
alter table public.profiles add column if not exists review_count int not null default 0;
alter table public.profiles add column if not exists follower_count int not null default 0;

create or replace function public.refresh_seller_review_stats(target_seller uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set
    seller_rating = coalesce((select round(avg(rating)::numeric, 2) from public.seller_reviews where seller_id = target_seller), seller_rating),
    review_count = coalesce((select count(*) from public.seller_reviews where seller_id = target_seller), 0)
  where id = target_seller;
end;
$$;

create or replace function public.refresh_seller_review_stats_trigger()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.refresh_seller_review_stats(coalesce(new.seller_id, old.seller_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists seller_reviews_refresh_stats on public.seller_reviews;
create trigger seller_reviews_refresh_stats
after insert or update or delete on public.seller_reviews
for each row execute function public.refresh_seller_review_stats_trigger();
