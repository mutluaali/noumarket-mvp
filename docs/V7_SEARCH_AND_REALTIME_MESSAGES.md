# V7 - Search and realtime messages

Bu sürüm iki çekirdek alanı güçlendirir:

1. Gelişmiş arama artık `/api/listings` üzerinden çalışır.
   - canlı arama
   - kategori
   - konum
   - minimum/maksimum fiyat
   - en yeni, popüler, ucuzdan pahalıya, pahalıdan ucuza sıralama
   - premium ilanlar üst sırada kalır

2. Mesajlaşma sistemi gerçek zamanlı hale getirildi.
   - konuşma listesi düzeltildi
   - okunmamış mesaj rozeti eklendi
   - sohbet ekranında Supabase Realtime aboneliği eklendi
   - mesaj okundu bilgisi için `read_at` güncellemesi eklendi

## Supabase SQL

Supabase SQL Editor'da şunu çalıştır:

```sql
sql/messages-realtime-v7.sql
```

Realtime çalışmazsa Supabase Dashboard > Database > Replication kısmında `messages` ve `conversations` tablolarının realtime'a açık olduğunu kontrol et.
