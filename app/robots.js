export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://noumarket-mvp.vercel.app';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/payment-success'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
