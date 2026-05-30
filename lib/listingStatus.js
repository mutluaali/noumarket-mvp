export const LISTING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PASSIVE: 'passive',
  SOLD: 'sold',
};

export const PUBLIC_LISTING_STATUSES = [LISTING_STATUS.APPROVED];

export function isPublicListingStatus(status) {
  return PUBLIC_LISTING_STATUSES.includes(String(status || '').toLowerCase());
}
