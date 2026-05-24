export const CATEGORY_TREE = [
  {
    id: 'real-estate', label: 'Emlak', icon: '🏠', count: 1009814,
    children: [
      { id: 'housing', label: 'Konut', count: 683000, children: [
        { id: 'home', label: 'Ev', count: 485231, children: [
          { id: 'detached-house', label: 'Müstakil Ev', count: 123456, children: [
            { id: 'detached-house-rent', label: 'Kiralık', count: 210654, fields: ['rooms','areaM2','floor','deposit','heating','furnished'] },
            { id: 'detached-house-sale', label: 'Satılık', count: 274577, fields: ['rooms','areaM2','floor','titleDeed','heating'] },
          ]},
          { id: 'apartment', label: 'Daire', count: 301775, children: [
            { id: 'apartment-rent', label: 'Kiralık', count: 188900, fields: ['rooms','areaM2','floor','deposit','heating','furnished'] },
            { id: 'apartment-sale', label: 'Satılık', count: 112875, fields: ['rooms','areaM2','floor','titleDeed','heating'] },
          ]},
          { id: 'villa', label: 'Villa', count: 60987, children: [
            { id: 'villa-rent', label: 'Kiralık', count: 18220, fields: ['rooms','areaM2','deposit','pool','furnished'] },
            { id: 'villa-sale', label: 'Satılık', count: 42767, fields: ['rooms','areaM2','titleDeed','pool'] },
          ]},
        ]},
        { id: 'workplace-real-estate', label: 'İşyeri', count: 124901, fields: ['areaM2','floor','usageType'] },
        { id: 'land', label: 'Arsa', count: 229999, fields: ['areaM2','zoningStatus','roadAccess'] },
        { id: 'projects', label: 'Konut Projeleri', count: 11244, fields: ['areaM2','rooms'] },
      ]},
      { id: 'daily-rental', label: 'Günlük Kiralık', count: 32771, fields: ['rooms','areaM2','furnished'] },
      { id: 'touristic', label: 'Turistik Tesis', count: 1278, fields: ['areaM2','usageType'] },
    ],
  },
  {
    id: 'vehicles', label: 'Vasıta', icon: '🚗', count: 784983,
    children: [
      { id: 'cars', label: 'Otomobil', count: 385841, fields: ['brand','model','year','mileage','fuelType','transmission'], children: [
        { id: 'car-volkswagen', label: 'Volkswagen', count: 48210, fields: ['model','year','mileage','fuelType','transmission'] },
        { id: 'car-renault', label: 'Renault', count: 45180, fields: ['model','year','mileage','fuelType','transmission'] },
        { id: 'car-fiat', label: 'Fiat', count: 39830, fields: ['model','year','mileage','fuelType','transmission'] },
        { id: 'car-bmw', label: 'BMW', count: 33720, fields: ['model','year','mileage','fuelType','transmission'] },
        { id: 'car-mercedes', label: 'Mercedes-Benz', count: 32110, fields: ['model','year','mileage','fuelType','transmission'] },
        { id: 'car-toyota', label: 'Toyota', count: 29540, fields: ['model','year','mileage','fuelType','transmission'] },
        { id: 'car-hyundai', label: 'Hyundai', count: 27460, fields: ['model','year','mileage','fuelType','transmission'] },
        { id: 'car-ford', label: 'Ford', count: 26300, fields: ['model','year','mileage','fuelType','transmission'] },
        { id: 'car-opel', label: 'Opel', count: 24190, fields: ['model','year','mileage','fuelType','transmission'] },
        { id: 'car-peugeot', label: 'Peugeot', count: 22670, fields: ['model','year','mileage','fuelType','transmission'] },
      ] },
      { id: 'suv-pickup', label: 'Arazi, SUV & Pickup', count: 106372, fields: ['brand','model','year','mileage','fuelType','transmission'], children: [
        { id: 'suv-toyota', label: 'Toyota', count: 14500, fields: ['model','year','mileage','fuelType','transmission'] },
        { id: 'suv-jeep', label: 'Jeep', count: 8900, fields: ['model','year','mileage','fuelType','transmission'] },
        { id: 'suv-land-rover', label: 'Land Rover', count: 7200, fields: ['model','year','mileage','fuelType','transmission'] },
        { id: 'suv-nissan', label: 'Nissan', count: 11900, fields: ['model','year','mileage','fuelType','transmission'] },
      ] },
      { id: 'electric-vehicles', label: 'Elektrikli Araçlar', count: 10036, fields: ['brand','model','year','mileage','rangeKm'] },
      { id: 'motorcycles', label: 'Motosiklet', count: 117508, fields: ['brand','model','year','mileage'] },
      { id: 'commercial', label: 'Ticari Araçlar', count: 15077, fields: ['brand','model','year','mileage','fuelType'] },
      { id: 'marine', label: 'Deniz Araçları', count: 10772, fields: ['brand','model','year','engineHours'] },
    ],
  },
  {
    id: 'parts', label: 'Yedek Parça, Aksesuar, Donanım & Tuning', icon: '🛠️', count: 3334547,
    children: [
      { id: 'vehicle-parts', label: 'Otomotiv Ekipmanları', count: 314802, fields: ['condition','brand'] },
      { id: 'motorcycle-parts', label: 'Motosiklet Ekipmanları', count: 106044, fields: ['condition','brand'] },
      { id: 'marine-parts', label: 'Deniz Aracı Ekipmanları', count: 19282, fields: ['condition','brand'] },
    ],
  },
  {
    id: 'technology', label: 'Teknoloji', icon: '📱', count: 1048517,
    children: [
      { id: 'phones', label: 'Telefon & Aksesuar', count: 348809, fields: ['brand','model','condition','warranty'] },
      { id: 'computers', label: 'Bilgisayar', count: 331985, fields: ['brand','model','condition','warranty'] },
      { id: 'tablets', label: 'Tablet', count: 74210, fields: ['brand','model','condition','warranty'] },
      { id: 'photography', label: 'Fotoğraf & Kamera', count: 55343, fields: ['brand','model','condition'] },
      { id: 'game-console', label: 'Oyun Konsolu & Oyun', count: 83212, fields: ['brand','model','condition','warranty'] },
      { id: 'wearable-tech', label: 'Akıllı Saat & Giyilebilir', count: 50344, fields: ['brand','model','condition','warranty'] },
      { id: 'electronics', label: 'Elektronik Ev Aletleri', count: 202399, fields: ['brand','condition','warranty'] },
    ],
  },
  {
    id: 'furniture-home', label: 'Mobilya & Ev', icon: '🛋️', count: 623512,
    children: [
      { id: 'living-room', label: 'Salon & Oturma Odası', count: 138420, fields: ['condition','deliveryOption'] },
      { id: 'bedroom', label: 'Yatak Odası', count: 97210, fields: ['condition','deliveryOption'] },
      { id: 'kitchen-furniture', label: 'Mutfak & Yemek Odası', count: 74485, fields: ['condition','deliveryOption'] },
      { id: 'office-furniture', label: 'Ofis Mobilyası', count: 42218, fields: ['condition','deliveryOption'] },
      { id: 'home-decoration', label: 'Ev Dekorasyon', count: 162301, fields: ['condition','deliveryOption'] },
      { id: 'garden-furniture', label: 'Bahçe Mobilyası', count: 38878, fields: ['condition','deliveryOption'] },
      { id: 'white-goods', label: 'Beyaz Eşya', count: 70399, fields: ['brand','condition','warranty','deliveryOption'] },
    ],
  },
  {
    id: 'fashion', label: 'Giyim & Aksesuar', icon: '👕', count: 420433,
    children: [
      { id: 'women-fashion', label: 'Kadın Giyim', count: 129870, fields: ['condition','size'] },
      { id: 'men-fashion', label: 'Erkek Giyim', count: 98411, fields: ['condition','size'] },
      { id: 'shoes', label: 'Ayakkabı', count: 74220, fields: ['condition','size'] },
      { id: 'bags', label: 'Çanta', count: 39844, fields: ['condition'] },
      { id: 'watches-jewelry', label: 'Saat & Takı', count: 36240, fields: ['condition','brand'] },
      { id: 'baby-kids-fashion', label: 'Bebek & Çocuk Giyim', count: 41848, fields: ['condition','size'] },
    ],
  },
  {
    id: 'hobby-sport', label: 'Spor, Hobi & Kitap', icon: '⚽', count: 322123,
    children: [
      { id: 'sport', label: 'Spor & Outdoor', count: 209487, fields: ['condition'] },
      { id: 'books', label: 'Kitap, Dergi & Film', count: 35336, fields: ['condition'] },
      { id: 'music-instruments', label: 'Müzik Aletleri', count: 42200, fields: ['brand','condition'] },
      { id: 'collectibles', label: 'Koleksiyon', count: 35100, fields: ['condition'] },
    ],
  },
  { id: 'services', label: 'Hizmetler', icon: '💼', count: 456211, children: [
    { id: 'repair', label: 'Tamir & Teknik Servis', count: 64000, fields: ['usageType'] },
    { id: 'transport', label: 'Nakliye', count: 42000, fields: ['usageType'] },
  ]},
  { id: 'jobs', label: 'İş İlanları', icon: '💼', count: 134221, children: [
    { id: 'full-time', label: 'Tam Zamanlı', count: 55000, fields: ['usageType'] },
    { id: 'part-time', label: 'Yarı Zamanlı', count: 21000, fields: ['usageType'] },
  ]},
  { id: 'pets', label: 'Hayvanlar Alemi', icon: '🐾', count: 124021, children: [
    { id: 'pet-accessories', label: 'Aksesuar', count: 22000, fields: ['condition'] },
  ]},
  { id: 'garden', label: 'Tarım & Bahçe', icon: '🌿', count: 98123, children: [
    { id: 'garden-tools', label: 'Bahçe & Yapı Market', count: 226083, fields: ['condition'] },
  ]},
];

export const FIELD_DEFINITIONS = {
  brand: { label: 'Marka', type: 'text', placeholder: 'BMW, Apple, Samsung...' },
  model: { label: 'Model', type: 'text', placeholder: '320i, iPhone 14 Pro...' },
  year: { label: 'Yıl', type: 'number', placeholder: '2018' },
  mileage: { label: 'Kilometre', type: 'number', placeholder: '85000' },
  fuelType: { label: 'Yakıt', type: 'select', options: ['Benzin','Dizel','Hibrit','Elektrik','LPG'] },
  transmission: { label: 'Vites', type: 'select', options: ['Otomatik','Manuel','Yarı otomatik'] },
  engineHours: { label: 'Motor Saati', type: 'number', placeholder: '1200' },
  rangeKm: { label: 'Menzil km', type: 'number', placeholder: '420' },
  rooms: { label: 'Oda Sayısı', type: 'select', options: ['1+0','1+1','2+1','3+1','4+1','5+'] },
  areaM2: { label: 'm²', type: 'number', placeholder: '120' },
  floor: { label: 'Kat', type: 'text', placeholder: '3 / 5' },
  deposit: { label: 'Depozito', type: 'number', placeholder: '50000' },
  heating: { label: 'Isıtma', type: 'select', options: ['Yok','Klima','Kombi','Merkezi','Soba'] },
  furnished: { label: 'Eşyalı mı?', type: 'select', options: ['Evet','Hayır'] },
  pool: { label: 'Havuz', type: 'select', options: ['Var','Yok'] },
  titleDeed: { label: 'Tapu Durumu', type: 'select', options: ['Kat mülkiyetli','Kat irtifaklı','Arsa tapulu','Bilinmiyor'] },
  zoningStatus: { label: 'İmar Durumu', type: 'select', options: ['Konut','Ticari','Tarla','Bağ & Bahçe','Bilinmiyor'] },
  roadAccess: { label: 'Yol Durumu', type: 'select', options: ['Asfalt','Stabilize','Toprak','Yol yok'] },
  usageType: { label: 'Kullanım Tipi', type: 'text', placeholder: 'Ofis, mağaza, servis...' },
  condition: { label: 'Durum', type: 'select', options: ['Sıfır','Yeni gibi','İyi','Kullanılmış','Hasarlı'] },
  warranty: { label: 'Garanti', type: 'select', options: ['Var','Yok','Bilinmiyor'] },
  deliveryOption: { label: 'Teslimat', type: 'select', options: ['Elden teslim','Kargo','Nakliye alıcıya ait','Satıcı teslim eder'] },
  size: { label: 'Beden / Ölçü', type: 'text', placeholder: 'M, L, 42, 120x200...' },
};

export function formatCount(value){
  if(value === undefined || value === null) return '';
  return new Intl.NumberFormat('tr-TR').format(value);
}

export function findCategoryNode(id, nodes = CATEGORY_TREE, parents = []){
  for(const node of nodes){
    const path = [...parents, node];
    if(node.id === id) return { node, path };
    if(node.children){
      const found = findCategoryNode(id, node.children, path);
      if(found) return found;
    }
  }
  return null;
}

export function buildCategoryLabel(categoryId, subcategoryId){
  const id = subcategoryId || categoryId;
  const found = findCategoryNode(id);
  return found ? found.path.map(x=>x.label).join(' > ') : '';
}

export function getCategoryById(id){ return findCategoryNode(id)?.node || null; }
export function getSubcategory(categoryId, subcategoryId){ return findCategoryNode(subcategoryId)?.node || null; }
export function getLeafCategories(nodes = CATEGORY_TREE){
  return nodes.flatMap(node => node.children?.length ? getLeafCategories(node.children) : [node]);
}

export function getDescendantCategoryIds(id){
  const found = findCategoryNode(id);
  if(!found) return [];
  const ids = [];
  function walk(node){
    ids.push(node.id);
    node.children?.forEach(walk);
  }
  walk(found.node);
  return ids;
}
