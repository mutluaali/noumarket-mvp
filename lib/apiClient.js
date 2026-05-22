export async function fetchJson(path, options = {}) {
  const timeoutMs = options.timeoutMs || 12000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(path, {
      ...options,
      cache: options.cache || 'no-store',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...(options.headers || {}),
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || `API hatası: ${response.status}`);
    }

    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Sunucu isteği zaman aşımına uğradı. Bağlantıyı kontrol edip tekrar dene.');
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}
