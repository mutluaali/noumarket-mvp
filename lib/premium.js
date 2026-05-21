import { supabase } from './supabase';

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 7));
  return date.toISOString();
}

export async function makeListingPremium(id, days = 7) {
  const { error } = await supabase
    .from('listings')
    .update({
      is_featured: true,
      featured_until: daysFromNow(days),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function removeListingPremium(id) {
  const { error } = await supabase
    .from('listings')
    .update({
      is_featured: false,
      featured_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function expireOldPremiumListings() {
  const { error } = await supabase
    .from('listings')
    .update({
      is_featured: false,
      featured_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq('is_featured', true)
    .lt('featured_until', new Date().toISOString());

  if (error) throw error;
}

export function premiumLabel(listing) {
  if (!listing?.isFeatured && !listing?.is_featured) return null;
  if (!listing?.featured_until && !listing?.featuredUntil) return 'Premium';

  const until = new Date(listing.featured_until || listing.featuredUntil);
  if (Number.isNaN(until.getTime())) return 'Premium';

  const remainingMs = until.getTime() - Date.now();
  const days = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  if (days <= 0) return 'Premium süresi doldu';
  return `Premium · ${days} gün kaldı`;
}
