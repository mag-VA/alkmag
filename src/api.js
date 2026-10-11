export async function api(path, options = {}) {
  const response = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = await response
    .json()
    .catch(() => ({
      error:
        "Serwer jest niedostępny. Uruchom aplikację poleceniem npm run dev.",
    }));
  if (!response.ok)
    throw new Error(payload.error || "Nie udało się wykonać operacji.");
  return payload;
}
