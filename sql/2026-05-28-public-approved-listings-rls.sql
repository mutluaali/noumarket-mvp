-- Public marketplace read policy.
-- Lets guest/authenticated users read only listings intended for the public marketplace.
-- Owners/admin policies for pending/draft listings should stay separate.

alter table public.listings enable row level security;

drop policy if exists "Public can read approved listings" on public.listings;
create policy "Public can read approved listings"
  on public.listings
  for select
  using (
    status = 'approved'
    and coalesce(expires_at, now() + interval '1 day') >= now()
  );

drop policy if exists "Owners can read own listings" on public.listings;
create policy "Owners can read own listings"
  on public.listings
  for select
  using (auth.uid() = user_id);
