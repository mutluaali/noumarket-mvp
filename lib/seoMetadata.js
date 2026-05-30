export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://noumarket-mvp.vercel.app';

export const DEFAULT_SITE_TITLE = 'NouMarket | Yeni Kaledonya İlan Pazarı';
export const DEFAULT_SITE_DESCRIPTION =
  'Yeni Kaledonya\'da araba, ev, elektronik, hizmet ve ikinci el ilanlarını keşfedin. Kolayca ilan verin, satıcılarla iletişime geçin.';

export const DEFAULT_OG_IMAGE_PATH = '/icon-192.png';

export function stripHtml(text = '') {
  return String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateText(text = '', max = 155) {
  const clean = stripHtml(text);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

export function absoluteUrl(path = '', base = SITE_URL) {
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path.startsWith('/') ? path : `/${path}`, base).toString();
}

export function buildDefaultShareImages(alt = 'NouMarket') {
  return [{ url: DEFAULT_OG_IMAGE_PATH, width: 192, height: 192, alt }];
}

export function formatListingPriceForMeta(row) {
  const amount = Number(row?.price || 0);
  if (!amount) return '';
  return `${amount.toLocaleString('tr-TR')} ${row?.currency || 'XPF'}`;
}

export function getListingShareImage(row, siteUrl = SITE_URL) {
  const related = Array.isArray(row?.listing_images)
    ? row.listing_images
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map((image) => image.image_url)
        .filter(Boolean)
    : [];

  const candidate = related[0] || row?.image_url || '';
  if (candidate && !/images\.unsplash\.com/i.test(candidate)) {
    return absoluteUrl(candidate, siteUrl);
  }

  return absoluteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl);
}

export function buildListingShareMetadata(listing, siteUrl = SITE_URL) {
  if (!listing) {
    return {
      title: { absolute: 'İlan bulunamadı | NouMarket' },
      description: 'Aradığınız ilan bulunamadı veya artık yayında değil.',
      robots: { index: false, follow: false },
    };
  }

  const priceText = formatListingPriceForMeta(listing);
  const location = listing.location && listing.location !== 'Tumu' ? listing.location : '';
  const category = listing.subcategory || listing.category || '';
  const title = [listing.title, priceText].filter(Boolean).join(' · ');
  const shareTitle = title ? `${title} | NouMarket` : 'NouMarket ilanı';

  const descriptionParts = [];
  const plainDescription = truncateText(listing.description, 120);
  descriptionParts.push(plainDescription || 'Bu ilanı NouMarket\'te görüntüleyin.');
  const context = [category, location].filter(Boolean).join(' · ');
  if (context) descriptionParts.push(context);
  const description = truncateText(descriptionParts.join(' '), 155);

  const imageUrl = getListingShareImage(listing, siteUrl);
  const pageUrl = `${siteUrl}/ilan/${listing.id}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: shareTitle,
      description,
      url: pageUrl,
      siteName: 'NouMarket',
      locale: 'tr_TR',
      type: 'article',
      images: [{ url: imageUrl, alt: listing.title || 'NouMarket ilanı' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      images: [imageUrl],
    },
  };
}

export function buildCategoryShareMetadata(category, siteUrl = SITE_URL) {
  if (!category) return {};

  const title = `${category.name} ilanları`;
  const shareTitle = `${title} | NouMarket`;
  const description = truncateText(
    `Yeni Kaledonya'da ${category.name.toLowerCase()} ilanlarını keşfedin. Satılık, kiralık ve ikinci el fırsatları inceleyin.`,
    155,
  );
  const pageUrl = `${siteUrl}/kategori/${category.slug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    keywords: category.keywords,
    openGraph: {
      title: shareTitle,
      description,
      url: pageUrl,
      siteName: 'NouMarket',
      locale: 'tr_TR',
      type: 'website',
      images: buildDefaultShareImages(shareTitle),
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl)],
    },
  };
}

export function buildLocationShareMetadata(location, siteUrl = SITE_URL) {
  if (!location) return {};

  const title = `${location.name} ilanları`;
  const shareTitle = `${title} | NouMarket`;
  const description = truncateText(
    `${location.name} bölgesindeki satılık, kiralık ve ikinci el ilanları keşfedin.`,
    155,
  );
  const pageUrl = `${siteUrl}/konum/${location.slug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: shareTitle,
      description,
      url: pageUrl,
      siteName: 'NouMarket',
      locale: 'tr_TR',
      type: 'website',
      images: buildDefaultShareImages(shareTitle),
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl)],
    },
  };
}

export function buildGlobalMetadata(siteUrl = SITE_URL) {
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: DEFAULT_SITE_TITLE,
      template: '%s | NouMarket',
    },
    description: DEFAULT_SITE_DESCRIPTION,
    applicationName: 'NouMarket',
    manifest: '/manifest.json',
    keywords: [
      'NouMarket',
      'Yeni Kaledonya',
      'Nouméa',
      'ilan pazarı',
      'ikinci el',
      'satılık',
      'kiralık',
      'araba ilanları',
      'emlak ilanları',
    ],
    authors: [{ name: 'NouMarket' }],
    creator: 'NouMarket',
    publisher: 'NouMarket',
    openGraph: {
      title: DEFAULT_SITE_TITLE,
      description: DEFAULT_SITE_DESCRIPTION,
      url: siteUrl,
      siteName: 'NouMarket',
      locale: 'tr_TR',
      type: 'website',
      images: buildDefaultShareImages(),
    },
    twitter: {
      card: 'summary_large_image',
      title: DEFAULT_SITE_TITLE,
      description: DEFAULT_SITE_DESCRIPTION,
      images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl)],
    },
    icons: {
      icon: DEFAULT_OG_IMAGE_PATH,
      apple: DEFAULT_OG_IMAGE_PATH,
    },
  };
}
