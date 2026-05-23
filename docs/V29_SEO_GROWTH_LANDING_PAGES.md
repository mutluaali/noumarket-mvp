# V29 — SEO Growth Landing Pages

Bu sürüm NouMarket'in organik trafik alması için kategori ve lokasyon bazlı SEO landing sayfaları ekler.

## Eklenenler

- `/kategori/[slug]` sayfaları
- `/konum/[slug]` sayfaları
- Dinamik metadata ve canonical URL
- CollectionPage JSON-LD structured data
- Dinamik sitemap
- Kategori ve lokasyon taxonomy dosyası
- SEO landing sayfalarında ilgili ilan listesi

## Neden önemli?

Marketplace büyümesinde sadece ana sayfa yetmez. Google kullanıcıları genelde şu tarz arar:

- Nouméa araç ilanları
- Yeni Kaledonya kiralık ev
- Nouméa ikinci el telefon
- Anse Vata kiralık stüdyo

Bu sürüm her kategori ve lokasyon için indexlenebilir sayfalar üretir.

## Kurulum

SQL gerekmez.

```bash
npm install
npm run dev
```

Deploy:

```bash
git add .
git commit -m "add seo landing pages and dynamic sitemap"
git push
```

## Test URL örnekleri

- `/kategori/arac`
- `/kategori/emlak`
- `/kategori/elektronik`
- `/konum/noumea`
- `/konum/anse-vata`

## Sonraki mantıklı adım

- Dynamic OG image generation
- Category copywriting polish
- Search Console entegrasyonu
- Local backlink stratejisi
