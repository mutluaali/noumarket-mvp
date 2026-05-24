export function withTimeout(promise, timeoutMs = 8000, message = 'İstek zaman aşımına uğradı') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function getErrorMessage(error, fallback = 'Veri yüklenemedi') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || error.details || error.hint || fallback;
}
