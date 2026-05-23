# V24 - Beta Feedback and PWA Install Layer

Bu sürüm NouMarket'i gerçek kullanıcı testine daha hazır hale getirir.

## Eklenenler

- Beta geri bildirim modalı
- Hata/fikir/yorum ayrımı
- Öncelik seviyesi
- Sayfa URL'i, viewport ve user-agent kaydı
- Mobil PWA install prompt
- SQL: `sql/v24-beta-feedback.sql`

## Neden önemli?

Production'a çıktıktan sonra en değerli veri kullanıcıların nerede takıldığıdır. Bu katman test kullanıcılarından hızlı bug ve fikir toplamayı sağlar.

## Kurulum

Supabase SQL Editor'da çalıştır:

```sql
sql/v24-beta-feedback.sql
```

Sonra projeyi deploy et:

```bash
git add .
git commit -m "add beta feedback and pwa install layer"
git push
```
