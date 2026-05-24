# V47 Product Rebuild - Classified Marketplace Direction

Bu paket hızlı tema denemesi değildir. Amaç NouMarket'i gerçek classified marketplace mantığına yaklaştırmaktır.

## Ürün yönü
- Ana fikir: sahibinden.com benzeri kategori tabanlı ilan keşfi.
- Fark: kopya renk/tema yerine modern, sade, güven veren desktop dili.
- Odak: kategori ağacı, alt kategori, marka/özellik filtreleri, hızlı tarama.

## Araştırmadan çıkan kararlar
- Büyük marketplace'lerde kullanıcıyı tutan şey gösterişli hero değil; güçlü arama, net kategori, hızlı filtre ve sonuç listesidir.
- Similarweb marketplace verilerinde Amazon/eBay/Trendyol gibi sitelerde yüksek sayfa/ziyaret metrikleri görülür; bu, arama + filtre + detay sayfası zincirinin önemini gösterir.
- UX kaynakları pazar yeri ürünlerinde forgiving search, autosuggestion, clear filters, structured categories ve relevant results noktalarını öne çıkarır.

## Yapılanlar
- Header yeniden yazıldı: tek arama motoru, net aksiyonlar, çalışan hesap menüsü.
- Ana sayfa yeniden düzenlendi: vitrin değil, ilan bulma merkezi.
- Kategori sidebar yeniden yazıldı: ana kategori -> alt kategori -> marka/özellik yapısı.
- Kategori seçenekleri ilan sayılarıyla çalışır hale getirildi.
- Tüm kategori ve filtre butonları state'e bağlıdır.
- Listeleme kartları ve liste satırları profesyonel classified yoğunluğuna çekildi.
- Gereksiz görsel şov ve kopya renk hissi azaltıldı.
- Build compile başarıyla geçti; sandbox statik üretimde süreye takıldı.

## Kurulum
npm install
npm run dev

## Canlıya alma
git add .
git commit -m "product grade classified marketplace rebuild"
git push
