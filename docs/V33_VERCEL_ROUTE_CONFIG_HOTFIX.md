# V33 - Vercel Route Config Hotfix

Bu paket Vercel production build sırasında oluşan şu hatayı düzeltir:

`Next.js can't recognize the exported runtime field in route. It must be a literal.`

Sebep: Bazı compatibility API route dosyaları `runtime` değerini başka route dosyasından re-export ediyordu.
Next.js App Router build aşamasında route segment config değerlerinin doğrudan literal olmasını bekler.

Düzeltilen route dosyaları:

- `app/api/create-checkout-session/route.js`
- `app/api/payments/create-checkout-session/route.js`
- `app/api/payments/webhook/route.js`
- `app/api/stripe-webhook/route.js`

Her dosyada artık:

```js
export const runtime = 'nodejs';
export { POST } from '@/app/api/.../route';
```

kullanılıyor.
