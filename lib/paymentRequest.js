import { getPremiumPlan, PREMIUM_PLANS, resolvePlanAmount } from './premiumPlans';
import { PREMIUM_SELLER_PLAN } from './sellerSubscription';
import { isPremiumSeller } from './accountPlans';
import { assertUserNotSuspended } from './suspension';
import { generatePaymentReference } from './paymentReference';

export async function resolveAuthenticatedUserId(supabaseAdmin, request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { error: 'Oturum bulunamadı.', status: 401 };

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user?.id) return { error: 'Oturum doğrulanamadı.', status: 401 };
  return { userId: data.user.id };
}

export async function validatePaymentRequest({
  supabaseAdmin,
  userId,
  productType,
  listingId,
  planId,
}) {
  await assertUserNotSuspended(supabaseAdmin, userId);

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, account_plan, premium_status, premium_ends_at, stripe_subscription_id')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) return { error: 'Profil bulunamadı.', status: 404 };

  if (productType === 'premium_seller') {
    if (isPremiumSeller(profile)) {
      return { error: 'Premium Satıcı aboneliğin zaten aktif.', status: 400 };
    }
    return {
      profile,
      productType: 'premium_seller',
      plan: PREMIUM_SELLER_PLAN,
      planId: PREMIUM_SELLER_PLAN.id,
      amount: PREMIUM_SELLER_PLAN.amount,
      currency: PREMIUM_SELLER_PLAN.currency,
      listingId: null,
      premiumDays: 30,
    };
  }

  const resolvedPlanId = planId || 'premium_7';
  const plan = PREMIUM_PLANS[resolvedPlanId] ? getPremiumPlan(resolvedPlanId) : null;
  if (!listingId) return { error: 'listingId gerekli.', status: 400 };
  if (!plan) return { error: 'Geçersiz premium planı.', status: 400 };

  const { data: listing, error: listingError } = await supabaseAdmin
    .from('listings')
    .select('id, title, user_id, status')
    .eq('id', listingId)
    .single();

  if (listingError || !listing) return { error: 'İlan bulunamadı.', status: 404 };
  if (listing.user_id !== userId) return { error: 'Sadece kendi ilanını premium yapabilirsin.', status: 403 };
  if (listing.status && !['approved', 'pending', 'active'].includes(listing.status)) {
    return { error: 'Sadece yayındaki veya onay bekleyen ilan premium yapılabilir.', status: 400 };
  }

  const amount = resolvePlanAmount(plan, { isPremiumSeller: isPremiumSeller(profile) });

  return {
    profile,
    productType: 'featured_listing',
    plan,
    planId: plan.id,
    amount,
    currency: plan.currency,
    listingId,
    listingTitle: listing.title,
    premiumDays: plan.days,
  };
}

export async function createManualPaymentOrder({
  supabaseAdmin,
  provider,
  status,
  userId,
  productType,
  planId,
  amount,
  currency,
  listingId = null,
  premiumDays = null,
  paymentInstructions = null,
  providerReference = null,
  metadata = {},
}) {
  const reference = await generatePaymentReference(supabaseAdmin);

  const insertPayload = {
    user_id: userId,
    listing_id: listingId,
    provider,
    provider_session_id: reference,
    reference,
    plan: planId,
    amount,
    currency,
    status,
    product_type: productType,
    premium_days: premiumDays,
    payment_instructions: paymentInstructions,
    provider_reference: providerReference,
    metadata: {
      ...metadata,
      reference,
      payment_method: provider,
    },
  };

  const { data, error } = await supabaseAdmin
    .from('payment_orders')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
