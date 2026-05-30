import { supabase } from './supabase';

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function adminFetch(path, options = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error('Yönetim oturumu bulunamadı.');

  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Yönetim isteği başarısız.');
  return payload;
}

export async function fetchAdminRevenue() {
  return adminFetch('/api/admin/revenue');
}

export async function startBillingPortal() {
  const token = await getAccessToken();
  if (!token) throw new Error('Oturum bulunamadı.');

  const response = await fetch('/api/stripe/billing-portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Faturalandırma portalı açılamadı.');
  return payload;
}

export async function startFeaturedCheckout({ listingId, userId, planId }) {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'featured_listing', listingId, userId, planId }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Ödeme başlatılamadı.');
  return payload;
}

export async function startPremiumSellerCheckout({ userId }) {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 'premium_seller', userId }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Abonelik başlatılamadı.');
  return payload;
}

async function authHeaders() {
  const token = await getAccessToken();
  if (!token) throw new Error('Oturum bulunamadı.');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchPaymentProviders() {
  const response = await fetch('/api/payments/providers');
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Ödeme yöntemleri yüklenemedi.');
  return payload.providers || [];
}

export async function startBankTransferOrder({ productType, listingId, planId }) {
  const response = await fetch('/api/payments/bank-transfer', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ productType, listingId, planId }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Havale talebi oluşturulamadı.');
  return payload;
}

export async function startEpayncOrder({ productType, listingId, planId }) {
  const response = await fetch('/api/payments/epaync', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ productType, listingId, planId }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'EpayNC ödemesi başlatılamadı.');
  return payload;
}

export async function fetchMyPendingPayments() {
  const response = await fetch('/api/payments/orders', {
    headers: await authHeaders(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Ödemeler yüklenemedi.');
  return payload.data || [];
}

export async function fetchPendingAdminPayments() {
  return adminFetch('/api/admin/payments/pending');
}

export async function reviewAdminPayment(orderId, action, reason = '') {
  return adminFetch(`/api/admin/payments/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action, reason }),
  });
}
