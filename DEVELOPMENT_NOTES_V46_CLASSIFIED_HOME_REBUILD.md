# V46 Classified Home Rebuild

Bu paket, ana sayfayı yeniden daha klasik ve kullanılabilir ilan sitesi mantığına çeker.

## Yapılanlar
- Büyük marketing/hero alanı kaldırıldı.
- Ana fikir sahibinden.com benzeri kategori ağacı ve ilan listesi yapısına döndürüldü.
- Ana kategorilerin altında alt kategoriler doğrudan gösterilecek şekilde sidebar yeniden yazıldı.
- Aktif kategori altında marka/ana filtre seçenekleri de görünür hale getirildi.
- Araç kategorisinde marka seçenekleri doğrudan kategori altında çalışır: Renault, Ford, BMW, Audi vb.
- Tüm kategori ve alt kategori butonları filtre state'ine bağlandı.
- Üst hızlı kategori butonları çalışır hale getirildi.
- URL filtre senkronizasyonu eklendi: category, subcategory, q, location parametreleri okunur/yazılır.
- İlan detay sayfası ana sayfaya daha benzer, daha ciddi ve daha az amatör olacak şekilde sadeleştirildi.
- Detay sayfasına aynı marka kimliğiyle üst bar ve breadcrumb eklendi.
- Geliştirici/feedback floating butonları kaldırıldı.

## Build
`npm run build` compile aşamasını başarıyla geçti. Statik sayfa üretimi sandbox süre sınırına takıldı.
