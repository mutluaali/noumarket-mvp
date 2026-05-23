export const PREMIUM_PLANS = {
  premium_7: {
    id: 'premium_7',
    name: 'Öne Çıkan 7 Gün',
    shortName: '7 Gün',
    amount: 1500,
    currency: 'XPF',
    days: 7,
    description: 'İlan 7 gün boyunca üst sıralarda ve premium rozetle görünür.',
    highlighted: true,
  },
  premium_30: {
    id: 'premium_30',
    name: 'Premium 30 Gün',
    shortName: '30 Gün',
    amount: 5000,
    currency: 'XPF',
    days: 30,
    description: 'Daha uzun görünürlük isteyen satıcılar için 30 günlük boost.',
  },
  showcase_30: {
    id: 'showcase_30',
    name: 'Vitrin 30 Gün',
    shortName: 'Vitrin',
    amount: 9900,
    currency: 'XPF',
    days: 30,
    description: 'Ana sayfa/kategori vitrini için en güçlü premium paket.',
    badge: 'En güçlü',
  },
};

export function getPremiumPlan(planId = 'premium_7') {
  return PREMIUM_PLANS[planId] || PREMIUM_PLANS.premium_7;
}

export function listPremiumPlans() {
  return Object.values(PREMIUM_PLANS);
}

export function formatPlanPrice(plan) {
  return `${Number(plan.amount || 0).toLocaleString('fr-FR')} ${plan.currency || 'XPF'}`;
}
