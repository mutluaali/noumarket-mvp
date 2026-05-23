# NouMarket v4 — Database + URL'li ilan detay sayfası

Bu sürümde platform demo seviyesinden gerçek ilan mimarisine taşındı.

## Eklenenler

- `/ilan/[id]` URL'li ilan detay sayfası eklendi.
- `/api/listings/[id]` ilan detay API rotası eklendi.
- İlan kartlarına tıklayınca artık modal yerine gerçek detay sayfasına gider.
- Detay sayfasına SEO metadata/OpenGraph desteği eklendi.
- Detay sayfasında görüntülenme sayacı artırılır.
- `sql/noumarket-core-schema-v4.sql` dosyası eklendi.

## Supabase tarafında yapman gereken

1. Supabase Dashboard aç.
2. SQL Editor bölümüne gir.
3. `sql/noumarket-core-schema-v4.sql` içeriğini çalıştır.
4. Storage bölümünde `listing-images` bucket oluştuğunu kontrol et.
5. Auth ile giriş yapıp yeni ilan ekle.
6. Admin panelinden ilanı onayla.
7. Ana sayfada ilana tıkla; `/ilan/ilan-id` sayfası açılmalı.

## Gerekli env değerleri

`.env.local` içinde minimum şunlar olmalı:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Production için `NEXT_PUBLIC_APP_URL` Vercel domainin olmalı.
