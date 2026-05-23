# V37 - Offers & Negotiation

Bu paket NouMarket'e pazarlık/teklif akışı ekler.

## Eklenenler

- İlan detayında "Teklif gönder" butonu
- Teklif gönderme modalı
- Gelen/gönderilen teklif merkezi
- Teklif kabul / red / iptal akışı
- `listing_offers` tablosu
- RLS güvenlik politikaları

## Neden önemli?

Marketplace'te mesajlaşma tek başına yeterli değil. Kullanıcıların ciddi alım niyeti göstermesi için fiyat teklifini ayrı bir sinyal olarak kaydetmek gerekir.

Bu metrikler ileride şunları besler:

- Satıcı dönüşüm oranı
- İlan fiyat kalitesi
- Talep yoğunluğu
- Premium önerileri
- Fiyat düşürme tavsiyeleri

## Kurulum

Supabase SQL Editor içinde çalıştır:

```sql
sql/v37-offers-negotiation.sql
```

Sonra deploy:

```bash
git add .
git commit -m "add offers and negotiation system"
git push
```
