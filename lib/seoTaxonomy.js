export const seoCategories = [
  {
    slug: 'arac',
    name: 'Araç',
    title: 'Yeni Kaledonya Araç İlanları',
    description: 'Nouméa ve Yeni Kaledonya genelinde satılık otomobil, 4x4, motosiklet ve ticari araç ilanlarını keşfet.',
    keywords: ['araba', 'oto', '4x4', 'motosiklet', 'Toyota', 'Nouméa araç'],
  },
  {
    slug: 'emlak',
    name: 'Emlak',
    title: 'Yeni Kaledonya Emlak İlanları',
    description: 'Kiralık ve satılık daire, ev, arsa ve ofis ilanlarını konum, fiyat ve özelliklere göre incele.',
    keywords: ['kiralık ev', 'satılık ev', 'daire', 'arsa', 'Nouméa emlak'],
  },
  {
    slug: 'elektronik',
    name: 'Elektronik',
    title: 'Yeni Kaledonya Elektronik İlanları',
    description: 'Telefon, bilgisayar, tablet, oyun konsolu ve diğer elektronik ürünler için güncel ikinci el ilanlar.',
    keywords: ['telefon', 'laptop', 'iPhone', 'bilgisayar', 'PlayStation'],
  },
  {
    slug: 'ev-yasam',
    name: 'Ev & Yaşam',
    title: 'Ev & Yaşam İlanları',
    description: 'Mobilya, beyaz eşya, dekorasyon ve ev yaşam ürünlerini Yeni Kaledonya genelinde bul.',
    keywords: ['mobilya', 'beyaz eşya', 'koltuk', 'masa', 'ev eşyası'],
  },
  {
    slug: 'is-hizmet',
    name: 'İş / Hizmet',
    title: 'İş ve Hizmet İlanları',
    description: 'Yerel hizmetler, iş ilanları, ustalar, tamir ve profesyonel servisleri tek yerde keşfet.',
    keywords: ['iş ilanı', 'hizmet', 'usta', 'tamir', 'servis'],
  },
  {
    slug: 'denizcilik-tekne',
    name: 'Denizcilik / Tekne',
    title: 'Denizcilik ve Tekne İlanları',
    description: 'Tekne, deniz ekipmanı, motor, balıkçılık ve denizcilik ürünleri için yerel ilanlar.',
    keywords: ['tekne', 'bot', 'deniz motoru', 'balıkçılık', 'marin'],
  },
];

export const seoLocations = [
  { slug: 'noumea', name: 'Nouméa', description: 'Nouméa merkezli ilanlar, araçlar, evler, elektronik ve yerel hizmetler.' },
  { slug: 'anse-vata', name: 'Anse Vata', description: 'Anse Vata çevresinde kiralık ev, ikinci el ürün ve hizmet ilanları.' },
  { slug: 'dumbea', name: 'Dumbéa', description: 'Dumbéa bölgesindeki güncel satılık/kiralık ilanlar.' },
  { slug: 'mont-dore', name: 'Mont-Dore', description: 'Mont-Dore için araç, emlak ve ikinci el ürün ilanları.' },
  { slug: 'paita', name: 'Païta', description: 'Païta çevresindeki yerel ilanlar.' },
  { slug: 'noumea-centre', name: 'Nouméa Centre', description: 'Nouméa Centre içindeki ürün, araç, emlak ve hizmet ilanları.' },
];

export function getCategoryBySlug(slug) {
  return seoCategories.find((item) => item.slug === slug) || null;
}

export function getLocationBySlug(slug) {
  return seoLocations.find((item) => item.slug === slug) || null;
}

export function slugifyTaxonomy(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
