-- NouMarket seller info safety migration
-- Supabase SQL Editor içinde bir kez çalıştırılabilir. Idempotenttir.

alter table listings add column if not exists seller_name text;
alter table listings add column if not exists seller_phone text;
alter table listings add column if not exists seller_email text;
alter table listings add column if not exists subcategory text;
alter table listings add column if not exists brand text;
alter table listings add column if not exists featured_until timestamptz;

-- Eski ilanlarda seller_name boşsa geçici görünür fallback üretir.
update listings
set seller_name = 'Satıcı'
where seller_name is null or trim(seller_name) = '';

-- Yeni ilanlar için indexler.
create index if not exists idx_listings_user_id on listings(user_id);
create index if not exists idx_listings_seller_phone on listings(seller_phone);
create index if not exists idx_listings_category_subcategory on listings(category, subcategory);
