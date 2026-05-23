-- NouMarket V9 - Seller dashboard support
-- Bu migration güvenli/idempotent çalışacak şekilde yazıldı.

alter table public.listings add column if not exists view_count integer not null default 0;
alter table public.listings add column if not exists updated_at timestamptz not null default now();

-- Eski kurulumlarda status check constraint farklı olabilir. Constraint adını bilmediğimiz için
-- sadece yaygın adları temizliyoruz; hata verirse ignore edilir.
do $$
begin
  if exists (
    select 1 from information_schema.constraint_column_usage
    where table_schema = 'public' and table_name = 'listings' and column_name = 'status'
  ) then
    begin
      alter table public.listings drop constraint if exists listings_status_check;
    exception when others then null;
    end;
  end if;
end $$;

alter table public.listings
  add constraint listings_status_check
  check (status in ('pending', 'approved', 'rejected', 'passive', 'sold'));

create index if not exists idx_listings_user_status_created
on public.listings(user_id, status, created_at desc);

create index if not exists idx_favorites_listing_id
on public.favorites(listing_id);

create index if not exists idx_conversations_listing_id
on public.conversations(listing_id);
