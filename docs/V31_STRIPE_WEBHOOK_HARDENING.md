# V31 — Stripe Webhook Hardening ve Premium Ödeme Güvenilirliği

Bu sürüm premium ödeme akışını production için daha güvenilir hale getirir.

## Eklenenler

- Stripe checkout route tekleştirildi.
- Eski `/api/create-checkout-session`, `/api/payments/create-checkout-session` route'ları yeni güvenli route'a bağlandı.
- Stripe webhook signature doğrulaması zorunlu hale getirildi.
- Webhook event log tablosu eklendi: `payment_events`.
- Premium aktivasyon idempotent hale getirildi.
- Başarı sayfası ödeme doğrulamasını fallback olarak yapmaya devam eder.
- Ödeme iptal sayfası eklendi: `/payment-cancelled`.
- `payment_orders` alanları güçlendirildi.

## Kurulum

1. Projeyi çalıştır:

```bash
npm install
npm run dev
```

2. Supabase SQL Editor'da çalıştır:

```sql
sql/v31-stripe-webhook-hardening.sql
```

3. Vercel Environment Variables alanında şu değişkenler olmalı:

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_SITE_URL=https://senin-domainin.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Stripe Dashboard → Developers → Webhooks:

Endpoint URL:

```text
https://senin-domainin.com/api/stripe/webhook
```

Dinlenecek eventler:

```text
checkout.session.completed
checkout.session.expired
payment_intent.payment_failed
```

## Not

Premium aktivasyon için asıl güvenilir kaynak webhook'tur. `/payment-success` sayfasındaki doğrulama sadece kullanıcının dönüş anında sistemi hızlı senkronize etmek için fallback olarak kalır.
