export const MAX_LISTING_IMAGE_SIZE_MB = 8;
export const MAX_LISTING_IMAGE_COUNT = 8;

export function validateListingImages(files = []) {
  const list = Array.from(files);

  if (list.length > MAX_LISTING_IMAGE_COUNT) {
    return { ok: false, error: `En fazla ${MAX_LISTING_IMAGE_COUNT} fotoğraf yükleyebilirsin.` };
  }

  const invalidType = list.find((file) => !file.type?.startsWith('image/'));
  if (invalidType) {
    return { ok: false, error: 'Sadece görsel dosyaları yüklenebilir.' };
  }

  const tooLarge = list.find((file) => file.size > MAX_LISTING_IMAGE_SIZE_MB * 1024 * 1024);
  if (tooLarge) {
    return { ok: false, error: `Her fotoğraf ${MAX_LISTING_IMAGE_SIZE_MB} MB altında olmalı.` };
  }

  return { ok: true, error: null };
}
