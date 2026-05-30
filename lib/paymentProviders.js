export const PAYMENT_PROVIDERS = {
  BANK_TRANSFER: 'bank_transfer',
  EPAYNC: 'epaync',
  STRIPE: 'stripe',
};

export const PAYMENT_STATUSES = {
  PENDING_MANUAL_REVIEW: 'pending_manual_review',
  PENDING_EXTERNAL_PAYMENT: 'pending_external_payment',
  PENDING: 'pending',
  PAID: 'paid',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const PROVIDER_LABELS = {
  bank_transfer: 'Banka havalesi',
  epaync: 'Kart ile güvenli ödeme (EpayNC)',
  stripe: 'Kart ile ödeme (Stripe)',
};

export function getPaymentProviderPriority() {
  const raw = process.env.PAYMENT_PROVIDER_PRIORITY || 'bank_transfer,epaync,stripe';
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isStripeCheckoutEnabled() {
  return getPaymentProviderPriority().includes(PAYMENT_PROVIDERS.STRIPE);
}

export function isEpayncEnabled() {
  return String(process.env.EPAYNC_ENABLED || '').toLowerCase() === 'true';
}

export function getEpayncConfig() {
  return {
    enabled: isEpayncEnabled(),
    paymentUrl: String(process.env.EPAYNC_PAYMENT_URL || '').trim(),
    merchantId: String(process.env.EPAYNC_MERCHANT_ID || '').trim(),
    apiKey: String(process.env.EPAYNC_API_KEY || '').trim(),
  };
}

export function isEpayncConfigured() {
  const config = getEpayncConfig();
  return config.enabled && Boolean(config.paymentUrl && config.merchantId && config.apiKey);
}

export function getBankTransferConfig() {
  return {
    accountName: String(process.env.BANK_TRANSFER_ACCOUNT_NAME || '').trim(),
    ibanOrRib: String(process.env.BANK_TRANSFER_IBAN_OR_RIB || '').trim(),
    bankName: String(process.env.BANK_TRANSFER_BANK_NAME || '').trim(),
    instructions: String(process.env.BANK_TRANSFER_INSTRUCTIONS || '').trim(),
  };
}

export function isBankTransferConfigured() {
  const config = getBankTransferConfig();
  return Boolean(config.accountName && config.ibanOrRib && config.bankName);
}

export function buildBankTransferInstructions(reference) {
  const config = getBankTransferConfig();
  return {
    reference,
    accountName: config.accountName,
    ibanOrRib: config.ibanOrRib,
    bankName: config.bankName,
    instructions: config.instructions,
  };
}

export function listClientPaymentProviders() {
  const priority = getPaymentProviderPriority();
  return priority.map((key) => {
    if (key === PAYMENT_PROVIDERS.BANK_TRANSFER) {
      return {
        key,
        label: PROVIDER_LABELS.bank_transfer,
        enabled: isBankTransferConfigured(),
        disabledReason: isBankTransferConfigured() ? null : 'Banka havalesi geçici olarak kullanılamıyor.',
      };
    }
    if (key === PAYMENT_PROVIDERS.EPAYNC) {
      const configured = isEpayncConfigured();
      const enabledFlag = isEpayncEnabled();
      return {
        key,
        label: PROVIDER_LABELS.epaync,
        enabled: configured,
        comingSoon: enabledFlag && !configured,
        disabledReason: !enabledFlag
          ? 'Yakında'
          : configured
            ? null
            : 'EpayNC yapılandırması eksik.',
      };
    }
    if (key === PAYMENT_PROVIDERS.STRIPE) {
      return {
        key,
        label: PROVIDER_LABELS.stripe,
        enabled: isStripeCheckoutEnabled() && Boolean(process.env.STRIPE_SECRET_KEY),
        hidden: !isStripeCheckoutEnabled(),
      };
    }
    return { key, label: key, enabled: false, disabledReason: 'Bilinmeyen ödeme yöntemi.' };
  }).filter((item) => !(item.key === PAYMENT_PROVIDERS.STRIPE && item.hidden));
}
