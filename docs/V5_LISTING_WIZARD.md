# NouMarket v5 - Profesyonel ilan verme akışı

Bu sürümde `ListingForm` tek sayfalık basit formdan çok adımlı ilan wizard yapısına taşındı.

## Eklenenler

- 5 adımlı ilan oluşturma akışı:
  1. Kategori
  2. İlan detayları
  3. Fotoğraflar
  4. İletişim
  5. Önizleme
- Kategoriye göre dinamik alanlar:
  - Araç
  - Emlak
  - Denizcilik
  - Elektronik
  - Ev & Yaşam
  - İş / Hizmet
  - Yedek Parça
  - Hayvanlar
- Drag & drop fotoğraf yükleme.
- Büyük fotoğraflar için tarayıcı tarafında JPEG sıkıştırma.
- `subcategory`, `condition`, `metadata` ve `premium_requested` kayıt desteği.
- Gönderim öncesi ilan önizleme.

## Not

Supabase şemasında `listings` tablosunda şu kolonlar olmalı:

- `subcategory text`
- `condition text`
- `metadata jsonb`

Bunlar v4 core schema içinde zaten var. Eski veritabanında yoksa SQL Editor'da şunu çalıştır:

```sql
alter table public.listings add column if not exists subcategory text;
alter table public.listings add column if not exists condition text default 'used';
alter table public.listings add column if not exists metadata jsonb default '{}'::jsonb;
```
