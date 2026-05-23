'use client';

import { useEffect } from 'react';
import { addRecentlyViewedId } from '@/lib/recentlyViewed';

export default function ListingViewTracker({ listingId }) {
  useEffect(() => {
    if (listingId) addRecentlyViewedId(listingId);
  }, [listingId]);

  return null;
}
