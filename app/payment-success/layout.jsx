export const metadata = {
  title: 'Ödeme başarılı',
  description:
    'Ödemeniz başarıyla alındı. İlan veya üyelik durumunuzu NouMarket hesabınızdan takip edebilirsiniz.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Ödeme başarılı | NouMarket',
    description:
      'Ödemeniz başarıyla alındı. İlan veya üyelik durumunuzu NouMarket hesabınızdan takip edebilirsiniz.',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Ödeme başarılı | NouMarket',
    description:
      'Ödemeniz başarıyla alındı. İlan veya üyelik durumunuzu NouMarket hesabınızdan takip edebilirsiniz.',
  },
};

export default function PaymentSuccessLayout({ children }) {
  return children;
}
