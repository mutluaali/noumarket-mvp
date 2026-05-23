# V28 — Product Analytics & Funnel Ölçümü

Bu sürüm NouMarket'e ürün analitiği ekler. Amaç yeni kullanıcı testinde hangi adımın çalıştığını ve nerede kayıp olduğunu görmek.

## Eklenenler

- `analytics_events` tablosu
- Client-side event tracking
- Admin panelinde `Product analytics` sekmesi
- Search, detail view, favorite, message, listing create, auth intent eventleri
- En çok aranan kelimeler
- Funnel oranları
- Son event logları

## Kurulum

1. Zip'i mevcut proje klasörünün üstüne çıkar.
2. Terminal:

```bash
npm install
npm run dev
```

3. Supabase SQL Editor'da çalıştır:

```sql
sql/v28-product-analytics.sql
```

4. Deploy:

```bash
git add .
git commit -m "add product analytics and funnel tracking"
git push
```

## Takip edilen ana eventler

- `page_view`
- `search`
- `auth_open`
- `listing_create_open`
- `listing_create`
- `favorite_add`
- `favorite_remove`
- `message_start`
- `pricing_open`
- `admin_open`

## Net yorum

Bu veri olmadan ürün geliştirme kör uçuş olur. Artık kullanıcıların sadece ne söylediğini değil, gerçekten ne yaptığını da görebiliriz.
