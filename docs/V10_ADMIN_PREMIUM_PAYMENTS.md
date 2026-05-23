# NouMarket v10 - Admin + Premium + Payment Layer

Bu sürüm ürünün ekonomik ve operasyonel katmanını güçlendirir.

## Eklenenler

- Geliştirilmiş admin paneli
  - operasyon özeti
  - ilan moderasyonu
  - şikayet yönetimi
  - Stripe ödeme kayıtları
  - gelir metriği
- Premium plan sistemi
  - 7 günlük öne çıkan ilan
  - 30 günlük premium ilan
  - 30 günlük vitrin paketi
- Satıcı panelinden premium paket seçimi
- Stripe checkout plan metadata iyileştirmesi
- `payment_orders` tablosu güçlendirmesi
- Şikayet durum takibi: `open`, `reviewing`, `resolved`, `dismissed`
- Premium süre bitiş altyapısı

## Kurulum

1. Projeyi çalıştır:

```bash
npm install
npm run dev
```

2. Supabase SQL Editor içinde çalıştır:

```sql
sql/admin-premium-v10.sql
```

3. `.env.local` içinde şunlar olmalı:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
CRON_SECRET=...
```

## Admin rolü verme

Kendi kullanıcı ID'ni bulup çalıştır:

```sql
update public.profiles
set role = 'admin'
where id = 'KENDI_USER_ID';
```

## Stripe webhook

Webhook endpoint:

```text
/api/stripe-webhook
```

Dinlenecek event:

```text
checkout.session.completed
```

## Not

Bu sürüm production öncesi en kritik katmanı ekler. Bundan sonraki doğru adım: SEO/sitemap, kategori sayfaları ve lokasyon bazlı landing page altyapısıdır.
