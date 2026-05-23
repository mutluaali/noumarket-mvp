# V38-V42 Bulk Growth Package

Bu paket beş geliştirme modülünü tek kümülatif güncellemede toplar. Ayrı ayrı zip vermek yerine tek paket kullanıldı; çünkü aynı dosyaları art arda ezmek Vercel build ve merge hatası riskini artırır.

## V38 — Satıcı yorumları ve puanlama
- Satıcı profilinde yorum alanı
- 1-5 yıldız puanlama
- Ortalama puanın profile yansıması
- RLS ile güvenli yorum kaydı

## V39 — Satıcı takip sistemi
- Satıcı profilinden takip
- İlan detayından satıcı takip
- İleride yeni ilan bildirimi için temel tablo

## V40 — Fiyat alarmı
- İlan detayında “Fiyat düşünce haber ver” butonu
- `price_watches` tablosu
- İleride cron/job ile bildirim üretmeye hazır altyapı

## V41 — İlan paylaşım akışı
- Native share destekli paylaşım
- Destek yoksa link kopyalama
- Mobilde virality etkisi için temel paylaşım UX’i

## V42 — Launch readiness katmanı
- Beta öncesi operasyon checklist bileşeni
- Güven, mobil, keşif ve likidite odakları

## Kurulum

```bash
npm install
npm run dev
```

Supabase SQL Editor:

```sql
sql/v38-v42-bulk-growth.sql
```

Deploy:

```bash
git add .
git commit -m "add bulk growth package v38 v42"
git push
```

## Not
Bu paket özellikle marketplace güveni ve geri dönüş davranışına odaklanır. Artık özellik ekleme hızı kontrollü tutulmalı; her paketten sonra canlıda auth, ilan detay, satıcı profili ve Vercel build test edilmelidir.
