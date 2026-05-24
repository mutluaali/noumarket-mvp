# V44 Desktop filter architecture

Bu paket desktop marketplace deneyimini özgünleştirir.

## Değişiklikler
- Sahibinden kopyası hissi kırıldı; koyu slate + cyan/emerald modern palet kuruldu.
- Header yeniden renklendirildi ve daha modern hale getirildi.
- Ana hero alanı vitrin yerine ürün arama/filtreleme değer önerisine çevrildi.
- Sol kategori alanı gerçek kategori merkezi olarak yeniden düzenlendi.
- Kategorilere zengin alt seçenekler eklendi:
  - Araç: marka, gövde tipi, yakıt, vites
  - Emlak: emlak tipi, oda, kullanım, eşya durumu
  - Denizcilik: marka/tip, gövde, motor
  - Elektronik: marka, cihaz tipi, durum
  - Ev & Yaşam, İş/Hizmet, Yedek Parça, Hayvanlar, Diğer için ayrı filtre grupları
- Alt seçeneklerde ilan sayısı gösterimi korunur.
- Filtre eşleşmesi sadece metadata değil, başlık/açıklama/subcategory fallback ile de çalışır.
- Layout desktop odaklı genişletildi: 1240px container ve 330px sidebar.

## Not
Build derleme aşaması local sandbox içinde başarıyla geçti. Statik sayfa üretimi süre limitine takıldığı için tamamlanamadı; compile/syntax hatası görülmedi.
