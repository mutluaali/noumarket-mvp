alter table listings
add column if not exists is_premium boolean default false;

alter table listings
add column if not exists is_featured boolean default false;

alter table listings
add column if not exists premium_until timestamptz;

create index if not exists listings_premium_until_idx
on listings (premium_until);

create index if not exists listings_featured_idx
on listings (is_featured);

create index if not exists listings_premium_idx
on listings (is_premium);
