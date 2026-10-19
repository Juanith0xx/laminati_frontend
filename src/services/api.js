const CLIENT_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "";

const SERVER_API_URL =
  process.env.API_SERVER_URL ||
  CLIENT_API_URL;

/* =========================================
   RESOLVER URL API
========================================= */
function getApiBaseUrl() {
  const isServer =
    typeof window === "undefined";

  const baseUrl = isServer
    ? SERVER_API_URL
    : CLIENT_API_URL;

  if (!baseUrl) {
    throw new Error(
      "La URL de la API no se encuentra configurada."
    );
  }

  /*
   * En navegador podemos usar /api porque apunta
   * al mismo dominio y Vercel lo reenvía a Railway.
   *
   * En Server Components necesitamos una URL absoluta.
   */
  if (
    isServer &&
    baseUrl.startsWith("/")
  ) {
    throw new Error(
      "API_SERVER_URL debe configurarse con una URL absoluta para solicitudes ejecutadas en el servidor."
    );
  }

  return baseUrl.replace(/\/+$/, "");
}

/* =========================================
   CONSTRUIR URL
========================================= */
function buildApiUrl(endpoint) {
  const baseUrl =
    getApiBaseUrl();

  const normalizedEndpoint =
    String(endpoint || "").startsWith("/")
      ? String(endpoint || "")
      : `/${String(endpoint || "")}`;

  return `${baseUrl}${normalizedEndpoint}`;
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

  const requestHeaders = {
    ...(body && !isFormData
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),

    /*
     * Compatibilidad temporal para llamadas antiguas
     * que todavía entreguen token explícitamente.
     * La autenticación principal usa cookie HttpOnly.
     */
    ...(token
      ? {
          Authorization:
            `Bearer ${String(token)
              .replace(
                /^Bearer\s+/i,
                ""
              )
              .trim()}`,
        }
      : {}),

    ...headers,
  };

  const response = await fetch(
    buildApiUrl(endpoint),
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
