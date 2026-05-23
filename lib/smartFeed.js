export function scoreListingForFeed(listing, context = {}) {
  const now = Date.now();
  const createdAt = listing?.created_at ? new Date(listing.created_at).getTime() : now;
  const ageHours = Math.max(1, (now - createdAt) / 36e5);
  const freshness = Math.max(0, 80 - ageHours * 1.6);
  const premiumBoost = listing?.isFeatured || listing?.is_premium ? 35 : 0;
  const viewScore = Math.min(30, Number(listing?.views || 0) / 8);
  const categoryAffinity = context.category && context.category !== 'Tümü' && listing?.category === context.category ? 25 : 0;
  const locationAffinity = context.location && context.location !== 'Tümü' && listing?.location === context.location ? 18 : 0;
  const query = String(context.query || '').trim().toLowerCase();
  const text = [listing?.title, listing?.description, listing?.category, listing?.location].join(' ').toLowerCase();
  const queryMatch = query && text.includes(query) ? 20 : 0;
  return Math.round(freshness + premiumBoost + viewScore + categoryAffinity + locationAffinity + queryMatch);
}

export function buildSmartFeed(listings = [], context = {}) {
  return [...listings]
    .map((listing) => ({ ...listing, smart_score: scoreListingForFeed(listing, context) }))
    .sort((a, b) => Number(b.smart_score || 0) - Number(a.smart_score || 0))
    .slice(0, context.limit || 8);
}

export function getTrendingListings(listings = [], limit = 6) {
  return [...listings]
    .map((listing) => ({
      ...listing,
      trend_score: Number(listing.views || 0) + (listing.isFeatured || listing.is_premium ? 75 : 0),
    }))
    .sort((a, b) => Number(b.trend_score || 0) - Number(a.trend_score || 0))
    .slice(0, limit);
}
