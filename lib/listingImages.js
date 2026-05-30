const REMOTE_FALLBACK_PATTERN = /images\.unsplash\.com/i;

/** Hardcoded remote placeholder URLs used historically — never treat as listing media. */
export function isRemotePlaceholderImage(url) {
  if (!url || typeof url !== 'string') return false;
  return REMOTE_FALLBACK_PATTERN.test(url);
}

export function pickListingImageUrls(row) {
  const related = Array.isArray(row?.listing_images)
    ? row.listing_images
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map((image) => image.image_url)
        .filter(Boolean)
    : [];

  if (related.length) return related;

  const fromArray = Array.isArray(row?.images) ? row.images.filter(Boolean) : [];
  if (fromArray.length) return fromArray;

  const single =
    row?.cover_image_url ||
    row?.coverImageUrl ||
    row?.image ||
    row?.image_url ||
    '';

  return single ? [single] : [];
}

export function pickListingImageUrl(row) {
  return pickListingImageUrls(row)[0] || '';
}

export function sanitizeListingImageFields(row) {
  const images = pickListingImageUrls(row);
  return { image: images[0] || '', images };
}
