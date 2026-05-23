# NouMarket v6 - Profil ve Satıcı Bilgisi Akışı

Bu sürümde kullanıcı profili akışı eklendi.

## Eklenenler

- Header üzerindeki e-posta alanı artık profil modalını açar.
- `components/ProfileModal.jsx` eklendi.
- Kullanıcı ad/mağaza adı ve telefon bilgisini güncelleyebilir.
- `lib/profiles.js` içine `upsertCurrentProfile` fonksiyonu eklendi.
- İlan verme formu profil bilgilerini otomatik satıcı bilgisi olarak doldurur.

## Supabase gereksinimi

`profiles` tablosunda şu kolonlar bulunmalı:

- `id uuid`
- `full_name text`
- `phone text`
- `avatar_url text`
- `role text`
- `created_at timestamptz`
- `updated_at timestamptz`

V4 fixed SQL dosyasını çalıştırdıysan bu kolonlar zaten var.

## Test

1. Giriş yap.
2. Header'daki e-posta butonuna bas.
3. Profil adını ve telefonu kaydet.
4. İlan Ver'e bas.
5. Satıcı bilgileri otomatik dolmalı.
