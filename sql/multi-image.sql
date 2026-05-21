create table if not exists listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  image_url text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table listing_images enable row level security;

drop policy if exists "Public read listing images" on listing_images;
drop policy if exists "Authenticated users can read listing images" on listing_images;
drop policy if exists "Authenticated users can insert own listing images" on listing_images;
drop policy if exists "Authenticated users can update own listing images" on listing_images;
drop policy if exists "Authenticated users can delete own listing images" on listing_images;

create policy "Public read listing images"
on listing_images for select
using (
  exists (
    select 1 from listings
    where listings.id = listing_images.listing_id
    and listings.status = 'approved'
  )
);

create policy "Authenticated users can read listing images"
on listing_images for select
to authenticated
using (true);

create policy "Authenticated users can insert own listing images"
on listing_images for insert
to authenticated
with check (
  exists (
    select 1 from listings
    where listings.id = listing_images.listing_id
    and listings.user_id = auth.uid()
  )
);

create policy "Authenticated users can update own listing images"
on listing_images for update
to authenticated
using (
  exists (
    select 1 from listings
    where listings.id = listing_images.listing_id
    and listings.user_id = auth.uid()
  )
);

create policy "Authenticated users can delete own listing images"
on listing_images for delete
to authenticated
using (
  exists (
    select 1 from listings
    where listings.id = listing_images.listing_id
    and listings.user_id = auth.uid()
  )
);
