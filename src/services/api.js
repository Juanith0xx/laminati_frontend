const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

/* =========================================
   OBTENER TOKEN LOCAL
========================================= */
function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedToken =
    localStorage.getItem("token");

  if (
    !storedToken ||
    storedToken === "null" ||
    storedToken === "undefined"
  ) {
    return null;
  }

  return storedToken
    .replace(/^"|"$/g, "")
    .replace(/^Bearer\s+/i, "")
    .trim();
}

/* =========================================
   API REQUEST
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
  } = {}
) {
  const isFormData =
    typeof FormData !== "undefined" &&
    body instanceof FormData;

  const authToken =
    token || getStoredToken();

  const requestHeaders = {
    ...(body && !isFormData
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),
    ...(authToken
      ? {
          Authorization:
            `Bearer ${authToken}`,
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
