import { supabase } from '@/lib/supabase';

const SESSION_KEY = 'noumarket_session_id_v28';

export function getAnalyticsSessionId() {
  if (typeof window === 'undefined') return null;
  let sessionId = window.localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function clean(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === 'string') return value.slice(0, 500);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 20);
  if (typeof value === 'object') {
    const output = {};
    Object.entries(value).slice(0, 30).forEach(([key, nextValue]) => {
      output[key] = clean(nextValue);
    });
    return output;
  }
  return String(value).slice(0, 500);
}

export async function trackEvent(eventName, properties = {}, userId = null) {
  if (!supabase || !eventName) return;
  try {
    const sessionId = getAnalyticsSessionId();
    const payload = {
      event_name: eventName,
      user_id: userId || null,
      session_id: sessionId,
      path: typeof window !== 'undefined' ? window.location.pathname : null,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent?.slice(0, 500) : null,
      properties: clean(properties) || {},
    };
    await supabase.from('analytics_events').insert(payload);
  } catch (error) {
    // Analytics ürün akışını asla bozmaz.
    console.warn('analytics event skipped:', error?.message || error);
  }
}
