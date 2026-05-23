# NouMarket Development Notes

Bu paket sahibinden.com benzeri MVP yönüne göre güncellendi.

## Bu sürümde yapılanlar

- Kategori sistemi merkezi hale getirildi: `lib/categories.js`
- İlan ekleme formu çoklu fotoğraf destekleyecek şekilde güncellendi.
- Fotoğraflar Supabase Storage `listing-images` bucket'ına yüklenir.
- Yüklenen fotoğraflar `listing_images` tablosuna yazılır.
- İlk fotoğraf kapak görseli olarak `listings.image_url` alanına işlenir.
- Favori butonları ana sayfa kartlarında aktif hale getirildi.
- Arama sıralama hatası düzeltildi: `price_low` / `price_high` artık çalışır.
- Header mobil uyumlu menüye geçirildi.
- Kategori listesi sahibinden benzeri pazaryeri mantığına genişletildi.

## Supabase tarafında gerekli SQL dosyaları

Supabase SQL Editor'de en az şunlar çalıştırılmış olmalı:

1. `sql/storage-policies.sql`
2. `sql/multi-image.sql`
3. `sql/favorites.sql`
4. İlanlar ve kullanıcı profilleri için mevcut ana tablo SQL'leri

## Önemli

`.env.local`, `.git`, `.next` ve `node_modules` bu teslim paketine bilinçli olarak eklenmedi.
Kendi bilgisayarında proje klasöründe `.env.local` dosyanı koru.

Kurulum:

```bash
npm install
npm run dev
```

Production test:

```bash
npm run build
```
