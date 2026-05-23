export async function safeJsonFetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    let payload = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: text };
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: payload?.error || payload?.message || 'İstek başarısız oldu.',
        data: null,
      };
    }

    return { ok: true, status: response.status, data: payload, error: null };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error?.name === 'AbortError' ? 'İstek zaman aşımına uğradı.' : error?.message || 'Ağ hatası oluştu.',
      data: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}
