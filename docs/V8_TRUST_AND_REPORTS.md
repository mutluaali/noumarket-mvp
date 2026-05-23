# NouMarket v8 - Güven ve Şikayet Altyapısı

Bu sürüm ilan detay modalına **İlanı şikayet et** akışı ekler.

## Supabase SQL
SQL Editor'da çalıştır:

```sql
sql/reports-trust-v8.sql
```

## Eklenenler
- `listing_reports` tablosu
- Kullanıcıların ilan şikayeti göndermesi
- Admin için tüm şikayetleri okuyup yönetmeye hazır RLS policy
- Profil güven alanları: avatar, bio, doğrulanmış hesap, satıcı skoru

## Not
Admin panelde şikayet yönetim ekranı sonraki pakette ayrı sayfa olarak güçlendirilecek.
