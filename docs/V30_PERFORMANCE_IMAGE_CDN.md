# V30 — Performance, Image CDN & Cache Layer

Bu paket marketplace hızını iyileştirmek için hazırlandı.

## Eklenenler

- `OptimizedImage` bileşeni
- İlan kartlarında Next.js Image kullanımı
- WebP/AVIF image format desteği
- Supabase ve Unsplash remote image allowlist
- `_next/image` cache header optimizasyonu
- Image fallback sistemi
- Mobil görsel boyutları için `sizes` optimizasyonu

## Neden önemli?

Marketplace performansında en büyük maliyet fotoğraflardır. İlan kartlarında büyük görseller direkt `<img>` ile gelirse mobilde yavaşlama, gereksiz bandwidth ve düşük Lighthouse skoru oluşur.

## Kurulum

```bash
npm install
npm run dev
```

## Deploy

```bash
git add .
git commit -m "add image cdn and performance layer"
git push
```

## Not

Supabase Storage domaini farklıysa `next.config.mjs` içindeki `remotePatterns` listesine eklenmelidir.
