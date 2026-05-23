# V26 — Anti-spam ve moderasyon kalite katmanı

Bu sürüm NouMarket'i beta kullanıcıya açmadan önce güvenlik ve operasyon tarafını güçlendirir.

## Gelenler

- Admin panelinde **Güvenlik kuyruğu** sekmesi
- Riskli ilan sinyali analizi
- Ön ödeme / acil satış / eksik telefon gibi scam sinyalleri
- Moderasyon aksiyon logları
- Admin için onayla / incelemede tut / engelle akışı
- Supabase tarafında `moderation_actions` audit tablosu
- Olası duplicate ilan helper fonksiyonu

## Kurulum

1. Projeyi kur:

```bash
npm install
npm run dev
```

2. Supabase SQL Editor'da çalıştır:

```sql
sql/v26-anti-spam-moderation.sql
```

3. Deploy:

```bash
git add .
git commit -m "add anti spam moderation layer"
git push
```

## Not

Bu sürüm otomatik olarak kullanıcıyı banlamaz. Sadece ilanları risk skoruna göre admin kuyruğuna taşır. Bu doğru yaklaşım; erken aşamada yanlış pozitifler kullanıcı kaybettirir.
