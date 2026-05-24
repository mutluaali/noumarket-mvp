# V45 Hybrid Discovery Marketplace Rebuild

Bu paket desktop marketplace ürün mimarisini daha özgün ve daha kullanışlı hale getirir.

## Ana değişiklikler

- Sahibinden kopyası hissi veren renk dili kırıldı.
- Header beyaz/premium utility çizgisine taşındı.
- NouMarket logosu daha özgün hale getirildi.
- Ana sayfa hero alanı “ilan vitrini” yerine “keşif marketplace” mantığına göre yenilendi.
- Sol panel “kategori listesi” olmaktan çıkarılıp “marketplace cockpit” haline getirildi.
- Araç, Emlak, Denizcilik, Elektronik, Ev & Yaşam, İş/Hizmet, Yedek Parça, Hayvanlar ve Diğer kategorileri daha derin alt seçeneklerle genişletildi.
- Her kategoriye quick pick seçenekleri eklendi.
- Araç kategorisi artık marka, model ailesi, gövde tipi, yakıt, vites ve kilometre bandı seviyesinde ayrışıyor.
- Emlak kategorisi emlak tipi, ilan tipi, oda sayısı, eşya durumu ve özellikler seviyesinde ayrışıyor.
- Elektronik kategorisi marka, cihaz tipi, durum ve depolama seviyesinde ayrışıyor.
- Denizcilik kategorisi marka, gövde tipi, motor ve kullanım seviyesinde ayrışıyor.
- Filtre seçenekleri metadata yanında başlık/açıklama/alt kategori üzerinden de eşleşmeye devam eder.

## Teknik not

`npm run build` compile aşamasını başarıyla geçti. Statik sayfa üretim aşaması sandbox süresine takıldı. Local/Vercel ortamında devam etmesi beklenir.
