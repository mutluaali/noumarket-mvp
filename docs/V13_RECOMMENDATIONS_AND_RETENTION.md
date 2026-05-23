# V13 - Recommendations & Retention Layer

Bu sürüm NouMarket'e kullanıcıyı geri getiren ilk ürün katmanını ekler.

## Eklenenler

- Son bakılan ilanlar alanı
- İlan detay sayfasında localStorage tabanlı görüntüleme takibi
- Benzer ilanlar öneri bloğu
- Aynı kategori + aynı lokasyon öncelikli öneri mantığı
- Premium ilanlara önerilerde öncelik
- Detay sayfasında daha fazla keşif akışı

## Neden önemli?

Marketplace projelerinde kullanıcı bir ilanı gördükten sonra hemen çıkarsa trafik kaybedilir. V13 ile kullanıcıya:

- kaldığı yerden devam etme,
- benzer ilanları keşfetme,
- daha uzun oturum süresi,
- daha fazla satıcı teması

sağlanır.

## Teknik not

Son bakılan ilanlar kullanıcı hesabına değil tarayıcıya bağlıdır. Bu bilerek yapıldı; login gerektirmeden çalışır ve MVP için hızlıdır. Sonraki aşamada `user_events` tablosuna taşınabilir.
