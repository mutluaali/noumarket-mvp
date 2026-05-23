# NouMarket V11 - Production Deploy + Startup UI Polish

Bu sürüm, projeyi localhost geliştirme aşamasından Vercel production hazırlığına taşır.

## Eklenenler

- Mobil sticky bottom navigation
- Güven şeridi / trust strip
- Production deploy checklist bileşeni
- Daha temiz global CSS ve mobil input zoom düzeltmesi
- `NEXT_PUBLIC_SITE_URL` destekli metadata
- `robots.txt` route
- `sitemap.xml` route
- Güncellenmiş `manifest.json`
- Güvenlik headerları ve Vercel header ayarları
- `.env.example` production değişkenleriyle genişletildi
- `admin-premium-v10.sql` fixed sürümle değiştirildi

## Vercel Environment Variables

Vercel > Project > Settings > Environment Variables alanına gir:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
CRON_SECRET=change-this-long-random-secret
```

## Supabase ayarları

Authentication > URL Configuration:

- Site URL: `https://your-domain.com`
- Redirect URLs:
  - `https://your-domain.com/**`
  - `http://localhost:3000/**`

Storage:

- `listing-images` bucket var olmalı.
- Public read policy aktif olmalı.
- Authenticated upload policy aktif olmalı.

## Test

```bash
npm install
npm run build
npm run dev
```

Build bu pakette başarıyla test edildi.
