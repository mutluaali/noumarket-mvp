# V35 Smart Feed & Recommendations

Bu sürüm NouMarket ana sayfasına davranış odaklı akıllı feed katmanı ekler.

## Eklenenler

- Akıllı feed bloğu
- Premium/taze/popüler ilan skorlaması
- Trend ilanlar paneli
- Kategori/lokasyon bağlamına göre öneri sıralaması
- Gelecekte öneri motoru için `feed_events` tablosu

## Kurulum

```bash
npm install
npm run dev
```

Supabase SQL Editor:

```sql
sql/v35-smart-feed.sql
```

Deploy:

```bash
git add .
git commit -m "add smart feed and recommendation engine"
git push
```
