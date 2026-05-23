# V23 - Seller Profile & Verification

Bu sürüm NouMarket'in güven katmanını bir adım ileri taşır.

## Eklenenler

- Her satıcı için public profil sayfası: `/satici/[id]`
- İlan detayından satıcı profiline geçiş
- Satıcı profilinde aktif ilanlar, görüntülenme ve güven skoru
- Profil modalında telefon doğrulama isteği
- `phone_verification_requested_at` alanı
- Admin/manual telefon doğrulaması için SQL helper

## Supabase SQL

Supabase SQL Editor'da çalıştır:

```sql
sql/v23-seller-profile-verification.sql
```

## Neden önemli?

Marketplace'te alıcı ilk önce ürüne değil satıcıya güvenir. Satıcı profili olmayan platformlar Facebook grubu gibi görünür. Satıcı profili, güven rozeti, telefon doğrulama ve aktif ilan geçmişi kullanıcıyı platformda tutar.

## Sonraki mantıklı adım

- Admin panelinden telefon doğrulama onayı
- Satıcı puanlama / yorum sistemi
- Şüpheli satıcı tespiti
- Tekrarlı ilan ve scam pattern analizi
