export const categoryTree = [
  {
    name: 'Araç',
    subcategories: ['Otomobil', 'SUV & 4x4', 'Motosiklet', 'Ticari araç', 'Araç kiralama', 'Yedek parça', 'Lastik & jant'],
  },
  {
    name: 'Emlak',
    subcategories: ['Konut', 'Kiralık ev', 'Satılık ev', 'Arsa', 'İş yeri', 'Günlük kiralık', 'Oda / paylaşımlı'],
  },
  {
    name: 'Denizcilik',
    subcategories: ['Tekne', 'Bot', 'Jet ski', 'Motor', 'Marin ekipman', 'Balıkçılık', 'Römork'],
  },
  {
    name: 'Elektronik',
    subcategories: ['Telefon', 'Bilgisayar', 'Tablet', 'Kamera', 'TV & ses', 'Oyun konsolu', 'Aksesuar'],
  },
  {
    name: 'Ev & Yaşam',
    subcategories: ['Mobilya', 'Beyaz eşya', 'Dekorasyon', 'Bahçe', 'Mutfak', 'Ev tekstili'],
  },
  {
    name: 'İş / Hizmet',
    subcategories: ['Usta hizmetleri', 'Temizlik', 'Nakliye', 'Özel ders', 'Bakım & tamir', 'İş ilanı'],
  },
  {
    name: 'Yedek Parça',
    subcategories: ['Oto parça', 'Marine parça', 'Makine parça', 'Elektrik', 'El aleti', 'Sarf malzeme'],
  },
  {
    name: 'Hayvanlar',
    subcategories: ['Evcil hayvan', 'Çiftlik hayvanı', 'Mama', 'Aksesuar', 'Sahiplendirme'],
  },
  {
    name: 'Diğer',
    subcategories: ['Spor', 'Hobi', 'Giyim', 'Kitap', 'Koleksiyon', 'Diğer ilanlar'],
  },
];

export const categories = categoryTree.map((category) => category.name);

export const categoryOptions = ['Tümü', ...categories];

export function getSubcategories(categoryName) {
  return categoryTree.find((category) => category.name === categoryName)?.subcategories || [];
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
