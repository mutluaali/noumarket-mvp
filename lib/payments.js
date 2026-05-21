export async function startPremiumCheckout({ listingId, userId, plan }) {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId, userId, plan }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Ödeme başlatılamadı.');
  }

  window.location.href = data.url;
}
