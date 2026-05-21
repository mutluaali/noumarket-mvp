-- Users can update only their own listings.
-- Edited listings go back to pending in the application code.

drop policy if exists "Users can update own listings" on listings;

create policy "Users can update own listings"
on listings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
