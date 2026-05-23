# V22 - Trust & Verification Layer

Bu sürüm NouMarket'in güven katmanını güçlendirir.

## Eklenenler

- Profil güven skoru
- Satıcı güven rozeti
- Mağaza adı alanı
- Konum alanı
- Satıcı açıklaması alanı
- Doğrulanmış kullanıcı altyapısı
- Telefon doğrulama altyapısı
- İlan detayında güven sinyalleri

## Supabase SQL

Supabase SQL Editor'da çalıştır:

```sql
sql/v22-trust-verification.sql
```

## Neden önemli?

Marketplace'te dönüşümü belirleyen ana faktör güvendir. Kullanıcı ilanı beğense bile satıcı profili zayıfsa mesaj atmaz. Bu katman satıcıyı daha dolu profil oluşturmaya iter.

## Sonraki gerçek doğrulama adımı

Bu sürüm gerçek SMS doğrulama yapmaz. Sadece altyapıyı hazırlar. Production için sonraki adımlar:

- Twilio / MessageBird / yerel SMS provider
- Telefon OTP doğrulama
- Kimlik doğrulama opsiyonu
- Admin tarafından verified badge verme
- Şüpheli hesap risk skoru
