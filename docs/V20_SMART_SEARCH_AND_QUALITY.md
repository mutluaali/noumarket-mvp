# V20 — Smart Search & Listing Quality

Bu sürüm NouMarket'i sahibinden.com benzeri klasik filtre yapısından bir adım ileri taşır: doğal dil arama ve ilan kalite skoru.

## Eklenenler

### 1. Akıllı arama ayrıştırıcı
Kullanıcı şunu yazabilir:

- `Nouméa içinde 100 bin XPF altı iPhone`
- `Dizel otomatik araç 1.5M XPF altı`
- `Denize yakın kiralık ev`
- `Tekne motoru ve denizcilik ekipmanı`

Sistem metni parçalar:

- kategori
- lokasyon
- minimum fiyat
- maksimum fiyat
- sıralama niyeti
- anahtar kelimeler

Bunları mevcut filtre state'ine uygular.

### 2. SearchIntentBar geliştirildi
Artık sadece örnek query yazmıyor; “Akıllı filtrele” butonuyla query'den gerçek filtre çıkarıyor.

### 3. İlan kalite skoru
İlan verme formunda sağ panelde canlı kalite skoru gösterilir:

- başlık kalitesi
- açıklama uzunluğu
- fotoğraf sayısı
- fiyat varlığı
- metadata doluluğu
- iletişim bilgisi
- riskli kelime kontrolü

Bu sistem ileride admin moderasyon ve scam detection için kullanılabilir.

## Teknik dosyalar

- `lib/smartSearch.js`
- `lib/listingQuality.js`
- `components/SearchIntentBar.jsx`
- `components/ListingForm.jsx`
- `app/page.jsx`

## Not
Bu sürüm SQL gerektirmez.
