# V14 - Saved Searches & Alerts

Bu sürüm NouMarket'e retention katmanı ekler.

## Eklenenler

- Kayıtlı aramalar
- Arama alarm merkezi
- Filtreyi tek tıkla kaydetme
- Kayıtlı aramayı tekrar uygulama
- Alarm aç/kapat
- Favori ilanda fiyat düşüşü bildirimi altyapısı
- Yeni onaylanan ilan kayıtlı aramaya uyarsa bildirim oluşturma trigger'ı

## Supabase

SQL Editor'da çalıştır:

```sql
sql/v14-saved-search-alerts.sql
```

## Neden önemli?

Marketplace'te kullanıcıyı geri getiren en güçlü sinyallerden biri "aradığın ürüne uygun yeni ilan geldi" bildirimidir. Bu özellik teknik olarak küçük görünür ama ürün büyümesi için kritik bir retention motorudur.
