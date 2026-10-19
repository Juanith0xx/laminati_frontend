const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

/* =========================================
   API REQUEST — SESIÓN HTTPONLY

   - La sesión principal viaja en una cookie HttpOnly.
   - credentials: "include" permite enviarla a Railway.
   - token se conserva SOLO como compatibilidad temporal
     para llamadas legacy explícitas; nunca se lee desde
     localStorage.
========================================= */
export async function apiRequest(
  endpoint,
  {
    method = "GET",
    body,
    token,
    headers = {},
    cache = "no-store",
    signal,
    credentials = "include",
    keepalive = false,
  } = {}
) {
  const isFormData =
    typeof FormData !== "undefined" &&
    body instanceof FormData;

  const explicitToken =
    String(token || "")
      .replace(/^Bearer\s+/i, "")
      .replace(/^"|"$/g, "")
      .trim();

  const requestHeaders = {
    ...(body && !isFormData
      ? { "Content-Type": "application/json" }
      : {}),
    ...(explicitToken
      ? { Authorization: `Bearer ${explicitToken}` }
      : {}),
    ...headers,
  };

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method,
      cache,
      signal,
      credentials,
      keepalive,
      headers: requestHeaders,
      ...(body !== undefined
        ? {
            body: isFormData
              ? body
              : JSON.stringify(body),
          }
        : {}),
    }
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        "Error al comunicarse con el servidor"
    );

    error.status = response.status;
    error.code = data?.code;
    error.data = data;

    throw error;
  }

  return data;
}
