const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

/* =========================================
   API REQUEST
   Autenticación mediante cookie HttpOnly.
   El navegador envía la sesión automáticamente.
========================================= */
export async function apiRequest(
  endpoint,
  {
    method = "GET",
    body,
    headers = {},
    cache = "no-store",
    signal,
  } = {}
) {
  const isFormData =
    typeof FormData !== "undefined" &&
    body instanceof FormData;

  const requestHeaders = {
    ...(body && !isFormData
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),
    ...headers,
  };

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method,
      cache,
      signal,
      credentials: "include",
      headers: requestHeaders,
      ...(body
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
