# V16 - Karşılaştırma ve kategori bazlı arama katmanı

Bu sürüm sahibinden.com benzeri karar verme akışına odaklanır.

## Eklenenler

- İlan kartlarına **Kıyasla** butonu eklendi.
- En fazla 4 ilan seçilerek karşılaştırma barı açılır.
- Karşılaştırma modalında fiyat, konum, kategori, durum, fotoğraf sayısı, görüntülenme ve metadata alanları yan yana gösterilir.
- Araç, emlak, elektronik ve denizcilik için kategoriye özel akıllı filtre alanı eklendi.
- Bu filtre alanı şimdilik UX katmanıdır; sonraki sürümde `metadata` kolonuna bağlı server-side filtreleme yapılmalıdır.

## Neden önemli?

Marketplace kullanıcıları özellikle araç, emlak ve elektronik ürünlerinde tek ilana bakıp karar vermez. Benzer ilanları yan yana kıyaslamak sitede kalma süresini ve güven hissini artırır.

## Sonraki adım

- Araç: marka/model/yıl/km filtrelerini gerçek API’ye bağla.
- Emlak: oda/m²/eşyalı/depozito filtrelerini gerçek API’ye bağla.
- Elektronik: marka/model/garanti/hafıza filtrelerini gerçek API’ye bağla.
