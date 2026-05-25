// NouMarket async helper utilities
// Fixes missing getErrorMessage export used by FavoritesModal.jsx and MessagesModal.jsx

export function getErrorMessage(error, fallback = "Bir hata oluştu") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error?.message && typeof error.message === "string") return error.message;
  if (error?.error_description && typeof error.error_description === "string") return error.error_description;
  if (error?.details && typeof error.details === "string") return error.details;
  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
}

export function withTimeout(promise, timeoutMs = 8000, message = "İşlem çok uzun sürdü. Lütfen tekrar dene.") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function safeAsync(asyncFn, options = {}) {
  const {
    timeoutMs = 8000,
    timeoutMessage = "İşlem çok uzun sürdü. Lütfen tekrar dene.",
    fallbackData = null,
  } = options;

  try {
    const result = await withTimeout(Promise.resolve().then(asyncFn), timeoutMs, timeoutMessage);
    return { data: result, error: null, ok: true };
  } catch (error) {
    return {
      data: fallbackData,
      error,
      message: getErrorMessage(error),
      ok: false,
    };
  }
}
