import { ACCOUNT_PLANS, LISTING_RIGHTS_CONFIG, PREMIUM_STATUSES } from './accountPlans';

export const PREMIUM_SELLER_PLAN = {
  id: 'premium_seller_monthly',
  name: 'Premium Satıcı',
  shortName: 'Aylık',
  amount: Number(process.env.PREMIUM_SELLER_MONTHLY_AMOUNT || 9900),
  currency: 'XPF',
  interval: 'month',
  description: 'Sınırsız ilan, 20 fotoğraf, premium rozet ve vitrin indirimleri.',
};

export function getPremiumSellerStripePriceId() {
  return process.env.STRIPE_PREMIUM_SELLER_PRICE_ID || null;
}

export function buildPremiumSellerProfilePatch({
  subscriptionId = null,
  customerId = null,
  periodEnd = null,
  status = PREMIUM_STATUSES.ACTIVE,
  now = new Date(),
} = {}) {
  const endsAt = periodEnd
    ? (periodEnd instanceof Date ? periodEnd.toISOString() : new Date(periodEnd * 1000).toISOString())
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const patch = {
    account_plan: status === PREMIUM_STATUSES.ACTIVE ? ACCOUNT_PLANS.PREMIUM_SELLER : ACCOUNT_PLANS.FREE,
    premium_status: status,
    premium_started_at: now.toISOString(),
    premium_ends_at: endsAt,
    listing_photo_limit: LISTING_RIGHTS_CONFIG.premiumPhotoLimit,
    can_add_video: status === PREMIUM_STATUSES.ACTIVE,
    has_storefront: status === PREMIUM_STATUSES.ACTIVE,
    boost_discount_percent: LISTING_RIGHTS_CONFIG.boostDiscountPercent,
    updated_at: now.toISOString(),
  };

  if (subscriptionId) patch.stripe_subscription_id = subscriptionId;
  if (customerId) patch.stripe_customer_id = customerId;

  if (status !== PREMIUM_STATUSES.ACTIVE) {
    patch.account_plan = ACCOUNT_PLANS.FREE;
    patch.listing_photo_limit = LISTING_RIGHTS_CONFIG.freePhotoLimit;
    patch.can_add_video = false;
    patch.has_storefront = false;
    patch.boost_discount_percent = 0;
  }

  return patch;
}

export function formatPremiumSellerPrice() {
  return `${Number(PREMIUM_SELLER_PLAN.amount || 0).toLocaleString('fr-FR')} ${PREMIUM_SELLER_PLAN.currency}/ay`;
}
