-- Kullanıcıların kendi ilanlarını görmesi/güncellemesi/silmesi için RLS politikaları.
-- Eğer aynı isimli policy varsa hata almamak için önce Supabase Policies ekranından eski policyleri kontrol et.

create policy "users can view own listings"
on listings
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can update own listings"
on listings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can delete own listings"
on listings
for delete
to authenticated
using (auth.uid() = user_id);
