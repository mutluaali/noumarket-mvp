# NouMarket Production Upgrade Core

Bu paket 5 büyük geliştirme için temel altyapıyı ekler:

1. Ödeme / Premium altyapısı
2. TR / FR / EN çoklu dil başlangıcı
3. PWA manifest
4. SEO default config
5. Moderation / audit tabloları

## Kurulum

1. Dosyaları proje köküne kopyala.
2. Supabase SQL Editor’da sırayla çalıştır:
   - `sql/payments-premium.sql`
   - `sql/moderation-audit.sql`
3. `public/manifest.json` dosyasının Next.js tarafından servis edildiğini kontrol et.
4. Sonra:

```bash
npm run dev
```

## Sonraki bağlama adımları

Bu paket bilerek çekirdek seviyede tutuldu. Sıradaki adımlar:

- Stripe checkout gerçek entegrasyonu
- Header’a LanguageSwitcher bağlama
- `app/layout.js` içine manifest metadata ekleme
- Listing detail sayfalarına SEO metadata ekleme
- Report listing modalı ekleme
