# V25 — Onboarding & Retention System

Bu sürüm NouMarket'in ilk kullanıcı aktivasyonunu güçlendirir. Amaç daha fazla özellik eklemek değil; yeni kullanıcının ürünü anlamasını, ilk aksiyonu almasını ve geri dönmesini sağlamaktır.

## Eklenenler

- Yeni kullanıcı onboarding modalı
- İlk ilan yönlendirmesi
- İlk favori teşviki
- İlk mesaj teşviki
- Geri dönen kullanıcı banner'ı
- Aktivasyon event tablosu altyapısı
- Local-first onboarding state

## Neden önemli?

Marketplace için kritik metrikler:

1. İlk arama
2. İlk favori
3. İlk mesaj
4. İlk ilan
5. Geri dönüş

Bu aksiyonlar oluşmadan marketplace büyümez. V25 bu yüzden ürünün büyüme tarafına odaklanır.

## Kurulum

1. Zip'i mevcut proje klasörünün üstüne çıkar.
2. Terminalde:

```bash
npm install
npm run dev
```

3. Supabase SQL Editor'da çalıştır:

```sql
sql/v25-onboarding-retention.sql
```

4. Deploy:

```bash
git add .
git commit -m "add onboarding and retention system"
git push
```
