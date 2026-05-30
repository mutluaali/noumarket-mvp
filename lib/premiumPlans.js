export const PREMIUM_PLANS = {
  premium_7: {
    id: 'premium_7',
    name: 'Öne Çıkan 7 Gün',
    shortName: '7 Gün',
    amount: 1500,
    premiumSellerAmount: 1000,
    currency: 'XPF',
    days: 7,
    description: 'İlan 7 gün boyunca üst sıralarda ve öne çıkan rozetle görünür.',
    highlighted: true,
    productType: 'featured_listing',
  },
  premium_14: {
    id: 'premium_14',
    name: 'Öne Çıkan 14 Gün',
    shortName: '14 Gün',
    amount: 2500,
    premiumSellerAmount: 1750,
    currency: 'XPF',
    days: 14,
    description: 'Orta vadeli görünürlük: 14 gün öne çıkan rozet ve vitrin sıralaması.',
  },
  premium_30: {
    id: 'premium_30',
    name: 'Öne Çıkan 30 Gün',
    shortName: '30 Gün',
    amount: 5000,
    premiumSellerAmount: 3500,
    currency: 'XPF',
    days: 30,
    description: 'Daha uzun görünürlük isteyen satıcılar için 30 günlük vitrin desteği.',
    badge: 'En popüler',
  },
};

export const FEATURED_LISTING_PLAN_IDS = ['premium_7', 'premium_14', 'premium_30'];

export function getPremiumPlan(planId = 'premium_7') {
  return PREMIUM_PLANS[planId] || PREMIUM_PLANS.premium_7;
}

export function listPremiumPlans() {
  return FEATURED_LISTING_PLAN_IDS.map((id) => PREMIUM_PLANS[id]).filter(Boolean);
}

export function resolvePlanAmount(plan, { isPremiumSeller = false } = {}) {
  if (!plan) return 0;
  if (isPremiumSeller && plan.premiumSellerAmount) return plan.premiumSellerAmount;
  return plan.amount;
}

export function formatPlanPrice(plan, options = {}) {
  const amount = resolvePlanAmount(plan, options);
  return `${Number(amount || 0).toLocaleString('tr-TR')} ${plan?.currency || 'XPF'}`;
}

export function featuredUntilFromDays(days, fromDate = new Date()) {
  const until = new Date(fromDate.getTime() + Number(days || 7) * 24 * 60 * 60 * 1000);
  return until.toISOString();
}
