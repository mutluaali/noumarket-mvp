# V48 - Modernized Classified Core

Bu paket önceki denemelerdeki modern/dribbble yönünü bırakıp sahibinden.com ergonomisine yaklaştırılmıştır.

Yapılanlar:
- Ana sayfa hero/vitrin ağırlığı azaltıldı; ilan merkezi mantığına geçildi.
- Sol kategori ağacı kalıcı hale getirildi.
- Ana kategorilerin altında alt kategoriler ve marka/özellik seçenekleri sürekli görünür hale getirildi.
- Araç kategorisinde Renault, Ford, BMW, Audi vb. marka filtreleri; diğer kategorilerde kategoriye özel filtreler çalışır.
- Kategori, alt kategori, marka/özellik, fiyat, konum ve sıralama aynı filtre motoruna bağlandı.
- URL senkronizasyonu korunmuştur.
- Navbar tek arama merkezi olarak bırakıldı.
- İç ilan detay sayfasının renk/spacing dili ana sayfaya yaklaştırıldı.
- Sahibinden kopyası renklerden kaçınıldı; cyan/slate tabanlı modern classified tema kullanıldı.
- Build compile başarılıdır.

Kurulum:
npm install
npm run dev

Canlıya alma:
git add .
git commit -m "modernized classified core"
git push
