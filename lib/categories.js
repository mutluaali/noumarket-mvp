export const categoryTree = [
  {
    name: 'Araç',
    label: 'Araçlar',
    description: 'Otomobil, motosiklet, ticari araç ve oto ekipmanları',
    subcategories: ['Otomobil', 'SUV & 4x4', 'Motosiklet', 'Ticari araç', 'Araç kiralama', 'Yedek parça', 'Lastik & jant'],
    quickPicks: ['Renault', 'Toyota', 'Ford', 'BMW', 'Audi', 'Otomatik', 'Dizel', 'SUV'],
    facets: [
      { label: 'Marka', key: 'brand', featured: true, options: ['Renault', 'Peugeot', 'Citroën', 'Toyota', 'Ford', 'BMW', 'Audi', 'Mercedes-Benz', 'Volkswagen', 'Hyundai', 'Kia', 'Nissan', 'Mazda', 'Mitsubishi', 'Suzuki', 'Dacia', 'Fiat', 'Honda', 'Tesla', 'Jeep', 'Mini', 'Volvo', 'Opel', 'Skoda', 'Seat', 'Cupra', 'Porsche', 'Land Rover', 'Range Rover', 'Lexus', 'Subaru', 'Isuzu', 'Chevrolet', 'Dodge', 'Chrysler', 'Alfa Romeo', 'Maserati', 'Jaguar', 'MG', 'BYD', 'Chery', 'Geely', 'Great Wall', 'SsangYong', 'Diğer'] },
      { label: 'Model ailesi', key: 'model', options: ['Clio', 'Megane', 'Captur', '208', '308', 'C3', 'Corolla', 'Yaris', 'Hilux', 'Ranger', 'Focus', 'Fiesta', '3 Serisi', '5 Serisi', 'A3', 'A4', 'Golf', 'Polo', 'Tucson', 'Sportage'] },
      { label: 'Gövde tipi', key: 'body_type', options: ['Sedan', 'Hatchback', 'SUV', 'Pickup', 'Van', 'Coupe', 'Cabrio', 'Station wagon'] },
      { label: 'Yakıt', key: 'fuel', options: ['Benzin', 'Dizel', 'Hibrit', 'Elektrik'] },
      { label: 'Vites', key: 'transmission', options: ['Otomatik', 'Manuel', 'Yarı otomatik'] },
      { label: 'Kilometre', key: 'mileage_band', options: ['0-50 bin km', '50-100 bin km', '100-150 bin km', '150-200 bin km', '200 bin km üstü'] },
    ],
  },
  {
    name: 'Emlak',
    label: 'Emlak',
    description: 'Kiralık, satılık, arsa, iş yeri ve kısa dönem konaklama',
    subcategories: ['Konut', 'Kiralık ev', 'Satılık ev', 'Arsa', 'İş yeri', 'Günlük kiralık', 'Oda / paylaşımlı'],
    quickPicks: ['Kiralık', 'Satılık', 'Daire', 'Villa', '2+1', '3+1', 'Eşyalı', 'Arsa'],
    facets: [
      { label: 'Emlak tipi', key: 'property_type', featured: true, options: ['Daire', 'Villa', 'Stüdyo', 'Müstakil ev', 'Rezidans', 'Arsa', 'Ofis', 'Dükkan', 'Depo', 'Tarla'] },
      { label: 'İlan tipi', key: 'listing_type', options: ['Kiralık', 'Satılık', 'Günlük kiralık', 'Devren', 'Paylaşımlı'] },
      { label: 'Oda sayısı', key: 'rooms', options: ['Stüdyo', '1+1', '2+1', '3+1', '4+1', '5+', 'Loft'] },
      { label: 'Eşya durumu', key: 'furnished', options: ['Eşyalı', 'Eşyasız', 'Kısmi eşyalı'] },
      { label: 'Öne çıkan', key: 'property_features', options: ['Deniz manzarası', 'Otopark', 'Bahçe', 'Balkon', 'Klima', 'Havuz', 'Güvenlik'] },
    ],
  },
  {
    name: 'Denizcilik',
    label: 'Denizcilik',
    description: 'Tekne, bot, jet ski, marin motor ve balıkçılık ekipmanları',
    subcategories: ['Tekne', 'Bot', 'Jet ski', 'Motor', 'Marin ekipman', 'Balıkçılık', 'Römork'],
    quickPicks: ['Yamaha', 'Mercury', 'Suzuki Marine', 'Zodiac', 'Jet ski', 'Dıştan takma'],
    facets: [
      { label: 'Marka / üretici', key: 'brand', featured: true, options: ['Yamaha', 'Mercury', 'Suzuki Marine', 'Honda Marine', 'Evinrude', 'Tohatsu', 'Beneteau', 'Jeanneau', 'Zodiac', 'Sea-Doo', 'Quicksilver', 'Bayliner', 'Lagoon', 'Boston Whaler', 'Yanmar', 'Volvo Penta', 'Selva', 'Garmin', 'Lowrance', 'Raymarine', 'Diğer'] },
      { label: 'Gövde tipi', key: 'marine_type', options: ['Fiber tekne', 'Alüminyum bot', 'Şişme bot', 'Yelkenli', 'Katamaran', 'Jet ski', 'Balıkçı teknesi'] },
      { label: 'Motor', key: 'engine_type', options: ['Dıştan takma', 'İçten takma', 'Elektrikli', 'Motorsuz', 'Dizel', 'Benzin'] },
      { label: 'Kullanım', key: 'marine_usage', options: ['Balıkçılık', 'Gezi', 'Spor', 'Ticari', 'Aile kullanımı'] },
    ],
  },
  {
    name: 'Elektronik',
    label: 'Elektronik',
    description: 'Telefon, bilgisayar, tablet, kamera, oyun ve aksesuar',
    subcategories: ['Telefon', 'Bilgisayar', 'Tablet', 'Kamera', 'TV & ses', 'Oyun konsolu', 'Aksesuar'],
    quickPicks: ['Apple', 'Samsung', 'Lenovo', 'HP', 'Dell', 'iPhone', 'Laptop', 'PlayStation'],
    facets: [
      { label: 'Marka', key: 'brand', featured: true, options: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Honor', 'Oppo', 'Vivo', 'Realme', 'Sony', 'LG', 'Lenovo', 'HP', 'Dell', 'Asus', 'Acer', 'MSI', 'Microsoft', 'Canon', 'Nikon', 'GoPro', 'DJI', 'JBL', 'Bose', 'Marshall', 'Logitech', 'Philips', 'Panasonic', 'Diğer'] },
      { label: 'Cihaz tipi', key: 'device_type', options: ['iPhone', 'Android telefon', 'Laptop', 'Masaüstü', 'Tablet', 'Kamera', 'Konsol', 'Kulaklık', 'Akıllı saat', 'Monitör'] },
      { label: 'Durum', key: 'condition_label', options: ['Sıfır', 'Çok temiz', 'Az kullanılmış', 'Kullanılmış', 'Parça/onarım'] },
      { label: 'Depolama / kapasite', key: 'storage', options: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB'] },
    ],
  },
  {
    name: 'Ev & Yaşam',
    label: 'Ev & Yaşam',
    description: 'Mobilya, beyaz eşya, bahçe, dekorasyon ve ev ihtiyaçları',
    subcategories: ['Mobilya', 'Beyaz eşya', 'Dekorasyon', 'Bahçe', 'Mutfak', 'Ev tekstili'],
    quickPicks: ['Koltuk', 'Yatak', 'Buzdolabı', 'Klima', 'Bahçe', 'Masa'],
    facets: [
      { label: 'Ürün grubu', key: 'home_type', featured: true, options: ['Koltuk', 'Yatak', 'Masa', 'Sandalye', 'Dolap', 'Buzdolabı', 'Çamaşır makinesi', 'Klima', 'Fırın', 'Bahçe mobilyası', 'Aydınlatma'] },
      { label: 'Oda / kullanım', key: 'room_type', options: ['Salon', 'Yatak odası', 'Mutfak', 'Banyo', 'Bahçe', 'Ofis', 'Çocuk odası'] },
      { label: 'Durum', key: 'condition_label', options: ['Sıfır', 'Çok temiz', 'Az kullanılmış', 'Kullanılmış'] },
    ],
  },
  {
    name: 'İş / Hizmet',
    label: 'İş / Hizmet',
    description: 'Usta, temizlik, nakliye, özel ders, bakım ve iş ilanları',
    subcategories: ['Usta hizmetleri', 'Temizlik', 'Nakliye', 'Özel ders', 'Bakım & tamir', 'İş ilanı'],
    quickPicks: ['Elektrikçi', 'Tesisatçı', 'Nakliye', 'Temizlik', 'Özel ders', 'Tamir'],
    facets: [
      { label: 'Hizmet türü', key: 'service_type', featured: true, options: ['Elektrikçi', 'Tesisatçı', 'Boyacı', 'Temizlik', 'Nakliye', 'Özel ders', 'Tamir', 'Bahçe bakımı', 'Klima servisi', 'İş ilanı'] },
      { label: 'Çalışma şekli', key: 'work_type', options: ['Tek seferlik', 'Saatlik', 'Günlük', 'Tam zamanlı', 'Yarı zamanlı', 'Proje bazlı'] },
      { label: 'Uygunluk', key: 'availability', options: ['Bugün uygun', 'Hafta sonu', 'Acil servis', 'Randevulu', 'Yerinde hizmet'] },
    ],
  },
  {
    name: 'Yedek Parça',
    label: 'Yedek Parça',
    description: 'Oto, marine, makine, elektrik ve endüstriyel parçalar',
    subcategories: ['Oto parça', 'Marine parça', 'Makine parça', 'Elektrik', 'El aleti', 'Sarf malzeme'],
    quickPicks: ['Motor', 'Filtre', 'Pompa', 'Fren', 'Elektrik', 'Universal'],
    facets: [
      { label: 'Parça grubu', key: 'part_type', featured: true, options: ['Motor', 'Şanzıman', 'Fren', 'Süspansiyon', 'Elektrik', 'Filtre', 'Pompa', 'Conta', 'El aleti', 'Sensör', 'Hidrolik'] },
      { label: 'Uyumluluk', key: 'brand', options: ['Renault', 'Toyota', 'Ford', 'BMW', 'Audi', 'Mercedes-Benz', 'Volkswagen', 'Peugeot', 'Citroën', 'Nissan', 'Hyundai', 'Kia', 'Yamaha', 'Mercury', 'Honda', 'Suzuki', 'Mitsubishi', 'Volvo', 'Universal', 'Diğer'] },
      { label: 'Durum', key: 'condition_label', options: ['Sıfır', 'Çıkma', 'Revizyonlu', 'Kullanılmış'] },
    ],
  },
  {
    name: 'Hayvanlar',
    label: 'Hayvanlar',
    description: 'Evcil hayvan, çiftlik hayvanı, mama, aksesuar ve sahiplendirme',
    subcategories: ['Evcil hayvan', 'Çiftlik hayvanı', 'Mama', 'Aksesuar', 'Sahiplendirme'],
    quickPicks: ['Köpek', 'Kedi', 'Kuş', 'Sahiplendirme', 'Mama', 'Aksesuar'],
    facets: [
      { label: 'Tür', key: 'pet_type', featured: true, options: ['Köpek', 'Kedi', 'Kuş', 'Balık', 'Tavuk', 'Keçi', 'At', 'Mama', 'Aksesuar'] },
      { label: 'İlan tipi', key: 'pet_listing_type', options: ['Sahiplendirme', 'Satılık', 'Kayıp', 'Aksesuar', 'Mama'] },
      { label: 'Yaş', key: 'pet_age', options: ['Yavru', 'Genç', 'Yetişkin'] },
    ],
  },
  {
    name: 'Diğer',
    label: 'Diğer',
    description: 'Spor, hobi, giyim, kitap, kamp ve koleksiyon',
    subcategories: ['Spor', 'Hobi', 'Giyim', 'Kitap', 'Koleksiyon', 'Diğer ilanlar'],
    quickPicks: ['Kamp', 'Bisiklet', 'Saat', 'Kitap', 'Giyim', 'Müzik'],
    facets: [
      { label: 'Alan', key: 'misc_type', featured: true, options: ['Spor', 'Kamp', 'Müzik', 'Kitap', 'Giyim', 'Saat', 'Koleksiyon', 'Oyuncak', 'Bisiklet', 'Fitness'] },
      { label: 'Durum', key: 'condition_label', options: ['Sıfır', 'Çok temiz', 'Az kullanılmış', 'Kullanılmış'] },
    ],
  },
];

export const categories = categoryTree.map((category) => category.name);

export const categoryOptions = ['Tümü', ...categories];

export function getCategoryConfig(categoryName) {
  return categoryTree.find((category) => category.name === categoryName) || null;
}

export function getSubcategories(categoryName) {
  return getCategoryConfig(categoryName)?.subcategories || [];
}

export function getCategoryFacets(categoryName) {
  return getCategoryConfig(categoryName)?.facets || [];
}

export function getFacetOptions(categoryName) {
  return getCategoryFacets(categoryName).flatMap((facet) => facet.options || []);
}

export function getQuickPicks(categoryName) {
  return getCategoryConfig(categoryName)?.quickPicks || [];
}

export const locations = [
  'Nouméa',
  'Dumbéa',
  'Mont-Dore',
  'Païta',
  'La Foa',
  'Bourail',
  'Koné',
  'Koumac',
  'Lifou',
  'Maré',
  'Ouvéa',
];
