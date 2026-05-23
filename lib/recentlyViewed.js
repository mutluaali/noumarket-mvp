const STORAGE_KEY = 'noumarket_recently_viewed_v1';
const MAX_ITEMS = 12;

function safeParse(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getRecentlyViewedIds() {
  if (typeof window === 'undefined') return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY))
    .map(String)
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
}

export function addRecentlyViewedId(id) {
  if (typeof window === 'undefined' || !id) return [];

  const normalizedId = String(id);
  const current = getRecentlyViewedIds();
  const next = [normalizedId, ...current.filter((item) => item !== normalizedId)].slice(0, MAX_ITEMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('noumarket:recently-viewed-updated', { detail: next }));
  return next;
}

export function clearRecentlyViewedIds() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('noumarket:recently-viewed-updated', { detail: [] }));
}
