import './globals.css';
import { buildGlobalMetadata } from '@/lib/seoMetadata';

export const metadata = buildGlobalMetadata();

export const viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
