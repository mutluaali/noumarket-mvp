import { DEFAULT_OG_IMAGE_PATH, DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_TITLE } from '@/lib/seoMetadata';

export const defaultSeo = {
  title: DEFAULT_SITE_TITLE,
  description: DEFAULT_SITE_DESCRIPTION,
  openGraph: {
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
    type: 'website',
    locale: 'tr_TR',
    images: [{ url: DEFAULT_OG_IMAGE_PATH, alt: 'NouMarket' }],
  },
};
