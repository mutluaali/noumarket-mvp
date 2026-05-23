# NouMarket V9 - Satıcı Paneli ve İlan Yönetimi

Bu sürüm kullanıcıların kendi ilanlarını gerçek bir satıcı panelinden yönetmesini sağlar.

## Eklenenler

- İlanlarım ekranına performans kartları
- Toplam ilan, yayındaki ilan, onay bekleyen ilan, görüntülenme, favori ve mesaj sayıları
- İlan bazında görüntülenme/favori/mesaj metrikleri
- İlanı pasife alma
- Pasif/reddedilmiş/satılmış ilanı tekrar onaya gönderme
- İlanı satıldı olarak işaretleme
- Güvenli server-side owner kontrolüyle güncelleme/silme endpoint'i
- `sql/seller-dashboard-v9.sql` migration dosyası

## Supabase

SQL Editor'da çalıştır:

```sql
sql/seller-dashboard-v9.sql
```

## Not

Düzenlenen veya tekrar yayına gönderilen ilanlar güvenlik için `pending` durumuna alınır. Admin onayı sonrası tekrar yayına çıkar.
