import { supabase } from './supabase';

export const ACCOUNT_PLANS = {
  FREE: 'free',
  PREMIUM_SELLER: 'premium_seller',
};

export const PREMIUM_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
};

export const LISTING_RIGHTS_CONFIG = {
  freeListingLimit: 1,
  freeListingDays: 30,
  freePhotoLimit: 5,
  premiumPhotoLimit: 20,
  standardListingPrice: 1200,
  premiumStandardListingPrice: 0,
  currency: 'XPF',
  boostDiscountPercent: 30,
};

export const BOOST_PACKAGES = [
  { id: 'boost_7', name: 'Boost 7 Gun', freeAmount: 1500, premiumAmount: 1000, days: 7 },
  { id: 'showcase_30', name: 'Vitrin 30 Gun', freeAmount: 9900, premiumAmount: 6900, days: 30 },
];

export function currentCycleYear(date = new Date()) {
  return date.getFullYear();
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isPremiumSeller(profile = {}, now = new Date()) {
  const endsAt = parseDate(profile?.premium_ends_at);
  const plan = profile?.account_plan || ACCOUNT_PLANS.FREE;
  const status = profile?.premium_status || PREMIUM_STATUSES.INACTIVE;
  return plan === ACCOUNT_PLANS.PREMIUM_SELLER
    && status === PREMIUM_STATUSES.ACTIVE
    && (!endsAt || endsAt.getTime() > now.getTime());
}

export function normalizeAccountEntitlements(profile = {}, usageOverride = null, now = new Date()) {
  const cycleYear = currentCycleYear(now);
  const premium = isPremiumSeller(profile, now);
  const storedCycleYear = Number(profile?.free_listing_cycle_year || cycleYear);
  const yearlyLimit = Number(profile?.yearly_free_listing_limit ?? LISTING_RIGHTS_CONFIG.freeListingLimit);
  const storedUsed = Number(profile?.yearly_free_listing_used || 0);
  const usedThisYear = usageOverride !== null && usageOverride !== undefined
    ? Number(usageOverride || 0)
    : (storedCycleYear === cycleYear ? storedUsed : 0);
  const remaining = premium ? Infinity : Math.max(0, yearlyLimit - usedThisYear);

  return {
    accountPlan: premium ? ACCOUNT_PLANS.PREMIUM_SELLER : ACCOUNT_PLANS.FREE,
    premiumStatus: premium ? PREMIUM_STATUSES.ACTIVE : (profile?.premium_status || PREMIUM_STATUSES.INACTIVE),
    premiumStartedAt: profile?.premium_started_at || null,
    premiumEndsAt: profile?.premium_ends_at || null,
    yearlyFreeListingLimit: yearlyLimit,
    yearlyFreeListingUsed: premium ? 0 : usedThisYear,
    freeListingCycleYear: cycleYear,
    freeListingRemaining: remaining,
    canCreateStandardListing: premium || remaining > 0,
    requiresStandardListingPayment: !premium && remaining <= 0,
    standardListingPrice: premium ? LISTING_RIGHTS_CONFIG.premiumStandardListingPrice : LISTING_RIGHTS_CONFIG.standardListingPrice,
    currency: LISTING_RIGHTS_CONFIG.currency,
    listingPhotoLimit: premium ? LISTING_RIGHTS_CONFIG.premiumPhotoLimit : Number(profile?.listing_photo_limit || LISTING_RIGHTS_CONFIG.freePhotoLimit),
    canAddVideo: premium || Boolean(profile?.can_add_video),
    hasStorefront: premium || Boolean(profile?.has_storefront),
    boostDiscountPercent: premium ? Number(profile?.boost_discount_percent || LISTING_RIGHTS_CONFIG.boostDiscountPercent) : 0,
    approvalSpeedLabel: premium ? 'Hizli onay sirasi' : 'Standart onay sirasi',
  };
}

async function countFreeQuotaListings(userId, cycleYear) {
  if (!userId || !supabase) return 0;
  const start = new Date(cycleYear, 0, 1).toISOString();
  const end = new Date(cycleYear + 1, 0, 1).toISOString();

  const explicit = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('created_with_free_quota', true)
    .gte('created_at', start)
    .lt('created_at', end);

  if (!explicit.error) return explicit.count || 0;

  const fallback = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start)
    .lt('created_at', end)
    .not('status', 'eq', 'deleted');

  if (fallback.error) {
    console.warn('listing quota fallback count skipped:', fallback.error.message);
    return 0;
  }
  return fallback.count || 0;
}

export async function getListingEntitlements(userId, profile = null) {
  const cycleYear = currentCycleYear();
  const storedYear = Number(profile?.free_listing_cycle_year || cycleYear);
  const hasFreshProfileUsage = profile && storedYear === cycleYear && profile.yearly_free_listing_used !== undefined && profile.yearly_free_listing_used !== null;
  const usage = hasFreshProfileUsage ? null : await countFreeQuotaListings(userId, cycleYear);
  return normalizeAccountEntitlements(profile || {}, usage);
}

export function buildListingBusinessFields(entitlements = {}) {
  const premium = entitlements.accountPlan === ACCOUNT_PLANS.PREMIUM_SELLER;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + LISTING_RIGHTS_CONFIG.freeListingDays);

  return {
    listing_type: premium ? 'premium_seller' : 'free',
    created_with_free_quota: !premium,
    seller_plan_at_creation: entitlements.accountPlan || ACCOUNT_PLANS.FREE,
    expires_at: premium ? null : expiresAt.toISOString(),
    is_boosted: false,
    boost_ends_at: null,
  };
}

export async function consumeFreeListingQuota(userId, profile = null) {
  if (!userId || !supabase) return;
  const cycleYear = currentCycleYear();
  const currentUsed = Number(
    Number(profile?.free_listing_cycle_year || cycleYear) === cycleYear
      ? profile?.yearly_free_listing_used || 0
      : 0
  );

  const payload = {
    id: userId,
    account_plan: profile?.account_plan || ACCOUNT_PLANS.FREE,
    premium_status: profile?.premium_status || PREMIUM_STATUSES.INACTIVE,
    yearly_free_listing_limit: Number(profile?.yearly_free_listing_limit || LISTING_RIGHTS_CONFIG.freeListingLimit),
    yearly_free_listing_used: currentUsed + 1,
    free_listing_cycle_year: cycleYear,
    listing_photo_limit: Number(profile?.listing_photo_limit || LISTING_RIGHTS_CONFIG.freePhotoLimit),
    can_add_video: Boolean(profile?.can_add_video || false),
    has_storefront: Boolean(profile?.has_storefront || false),
    boost_discount_percent: Number(profile?.boost_discount_percent || 0),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) console.warn('free listing quota update skipped:', error.message);
}

export function formatXpfAmount(amount) {
  return `${Number(amount || 0).toLocaleString('fr-FR')} ${LISTING_RIGHTS_CONFIG.currency}`;
}
