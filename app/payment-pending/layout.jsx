export const metadata = {
  title: 'Ödeme onayı bekleniyor',
  description:
    'Ödeme talebiniz oluşturuldu. Banka havalesi onaylandıktan sonra ilgili haklarınız aktif edilir.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Ödeme onayı bekleniyor | NouMarket',
    description:
      'Ödeme talebiniz oluşturuldu. Banka havalesi onaylandıktan sonra ilgili haklarınız aktif edilir.',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Ödeme onayı bekleniyor | NouMarket',
    description:
      'Ödeme talebiniz oluşturuldu. Banka havalesi onaylandıktan sonra ilgili haklarınız aktif edilir.',
  },
};

export default function PaymentPendingLayout({ children }) {
  return children;
}
