# V21 Stabilization Layer

Bu sürümün amacı yeni özellik eklemekten çok production davranışını daha güvenli hale getirmektir.

## Eklenen katmanlar

- Global error boundary görünümü
- Güvenli JSON fetch helper
- Basit in-memory rate limit helper
- Upload guard helper
- Production loading fallback yaklaşımı
- Mobil performans kontrol listesi

## Kullanım

Yeni API route yazarken `lib/safeFetch.js` ve `lib/rateLimit.js` dosyalarını referans al. Büyük kullanıcı trafiğinde bu in-memory rate limit tek başına yeterli değildir; Vercel KV, Upstash Redis veya Supabase tabanlı server-side rate limit gerekir.
