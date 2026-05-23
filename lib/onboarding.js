export const ONBOARDING_KEY = 'noumarket_onboarding_v25_done';
export const RETURNING_USER_KEY = 'noumarket_last_visit_v25';
export const FIRST_FAVORITE_KEY = 'noumarket_first_favorite_v25';
export const FIRST_MESSAGE_KEY = 'noumarket_first_message_v25';

export function hasCompletedOnboarding() {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(ONBOARDING_KEY) === 'done';
}

export function completeOnboarding() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ONBOARDING_KEY, 'done');
}

export function getReturningUserState() {
  if (typeof window === 'undefined') return { isReturning: false, daysAway: 0 };
  const now = Date.now();
  const lastVisit = Number(window.localStorage.getItem(RETURNING_USER_KEY) || 0);
  window.localStorage.setItem(RETURNING_USER_KEY, String(now));

  if (!lastVisit) return { isReturning: false, daysAway: 0 };
  const daysAway = Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24));
  return { isReturning: daysAway >= 1, daysAway };
}

export function markActivationEvent(eventName) {
  if (typeof window === 'undefined') return;
  const key = eventName === 'favorite' ? FIRST_FAVORITE_KEY : FIRST_MESSAGE_KEY;
  window.localStorage.setItem(key, 'done');
}

export function getActivationState() {
  if (typeof window === 'undefined') return { firstFavoriteDone: true, firstMessageDone: true };
  return {
    firstFavoriteDone: window.localStorage.getItem(FIRST_FAVORITE_KEY) === 'done',
    firstMessageDone: window.localStorage.getItem(FIRST_MESSAGE_KEY) === 'done',
  };
}
