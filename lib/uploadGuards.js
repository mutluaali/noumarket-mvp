export const MAX_LISTING_IMAGE_SIZE_MB = 5;
export const MAX_LISTING_IMAGE_COUNT = 20;

export function validateListingImageFile(file) {
  if (!file?.type?.startsWith('image/')) {
    return { ok: false, error: 'Sadece görsel dosyaları yüklenebilir.' };
  }

  if (file.size > MAX_LISTING_IMAGE_SIZE_MB * 1024 * 1024) {
    return { ok: false, error: `Her fotoğraf ${MAX_LISTING_IMAGE_SIZE_MB} MB altında olmalı.` };
  }

  return { ok: true, error: null };
}

export function validateListingImages(files = [], maxCount = MAX_LISTING_IMAGE_COUNT) {
  const list = Array.from(files);

  if (list.length > maxCount) {
    return { ok: false, error: `En fazla ${maxCount} fotoğraf yükleyebilirsin.` };
  }

  for (const file of list) {
    const fileValidation = validateListingImageFile(file);
    if (!fileValidation.ok) return fileValidation;
  }

  return { ok: true, error: null };
}
