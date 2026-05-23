import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://noumarket-mvp.vercel.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'NouMarket | New Caledonia Classifieds',
    template: '%s | NouMarket',
  },
  description:
    'NouMarket is a local marketplace for New Caledonia: cars, real estate, electronics, marine equipment, services and second-hand listings.',
  applicationName: 'NouMarket',
  manifest: '/manifest.json',
  keywords: [
    'NouMarket',
    'Nouméa',
    'New Caledonia',
    'Nouvelle-Calédonie',
    'classifieds',
    'marketplace',
    'occasion',
    'annonces',
  ],
  authors: [{ name: 'NouMarket' }],
  creator: 'NouMarket',
  publisher: 'NouMarket',
  openGraph: {
    title: 'NouMarket | New Caledonia Classifieds',
    description:
      'Buy, sell, rent and find services in New Caledonia.',
    url: siteUrl,
    siteName: 'NouMarket',
    locale: 'fr_NC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NouMarket | New Caledonia Classifieds',
    description:
      'Buy, sell, rent and find services in New Caledonia.',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
