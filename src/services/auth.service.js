import { apiRequest } from "@/services/api";

const LEGACY_AUTH_TOKEN_KEY = "token";
export const AUTH_USER_KEY = "user";
export const AUTH_CHANGED_EVENT = "laminati-auth-changed";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase();

const isSafeInternalPath = (value) => {
  const path = String(value || "").trim();

  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\")
  );
};

export const getRoleLabel = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "ADMIN") {
    return "Administrador";
  }

  if (normalizedRole === "VENDEDOR") {
    return "Vendedor";
  }

  if (normalizedRole === "USUARIO_EMPRESA") {
    return "Empresa cliente";
  }

  if (normalizedRole === "CLIENTE") {
    return "Cliente";
  }

  return "Usuario";
};

export const getDefaultDestinationForRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "ADMIN") {
    return "/admin/showroom";
  }

  if (normalizedRole === "VENDEDOR") {
    return "/admin/dashboard";
  }

  if (
    normalizedRole === "CLIENTE" ||
    normalizedRole === "USUARIO_EMPRESA"
  ) {
    return "/mi-cuenta";
  }

  return "/";
};

const SELLER_ALLOWED_PREFIXES = [
  "/admin/dashboard",
  "/admin/showroom",
  "/admin/cotizaciones",
  "/admin/pedidos",
  "/admin/pagos",
  "/admin/retiros",
  "/admin/contactos",
  "/admin/notificaciones",
];

const isSellerAdminPath = (path) =>
  SELLER_ALLOWED_PREFIXES.some(
    (prefix) =>
      path === prefix ||
      path.startsWith(`${prefix}/`)
  );

export const resolvePostLoginDestination = ({
  role,
  redirect,
}) => {
  const normalizedRole = normalizeRole(role);
  const requestedPath = String(
    redirect || ""
  ).trim();

  if (!isSafeInternalPath(requestedPath)) {
    return getDefaultDestinationForRole(
      normalizedRole
    );
  }

  if (
    requestedPath === "/login" ||
    requestedPath.startsWith("/login?")
  ) {
    return getDefaultDestinationForRole(
      normalizedRole
    );
  }

  if (normalizedRole === "ADMIN") {
    return requestedPath;
  }

  if (normalizedRole === "VENDEDOR") {
    if (requestedPath === "/admin") {
      return "/admin/dashboard";
    }

    if (requestedPath.startsWith("/admin/")) {
      return isSellerAdminPath(requestedPath)
        ? requestedPath
        : "/admin/dashboard";
    }

    return "/admin/dashboard";
  }

  if (
    requestedPath === "/admin" ||
    requestedPath.startsWith("/admin/")
  ) {
    return "/mi-cuenta";
  }

  return requestedPath;
};

export const loginUser = async ({
  email,
  password,
}) => {
  return apiRequest("/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });
};

export const registerCustomer = async (payload) => {
  return apiRequest("/auth/register", {
    method: "POST",
    body: payload,
  });
};

export const registerCompany = async (payload) => {
  return apiRequest("/auth/register-company", {
    method: "POST",
    body: payload,
  });
};

export const getAuthenticatedUser = async () => {
  return apiRequest("/auth/me");
};

export const saveAuthSession = (response) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!response?.user) {
    throw new Error(
      "Respuesta de autenticación inválida"
    );
  }

  /*
   * El JWT ya no se persiste en Web Storage.
   * El backend establece la sesión en cookie HttpOnly.
   * Removemos cualquier token legacy que haya quedado
   * de una versión anterior del frontend.
   */
  window.localStorage.removeItem(
    LEGACY_AUTH_TOKEN_KEY
  );

  window.localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(response.user)
  );

  window.dispatchEvent(
    new Event(AUTH_CHANGED_EVENT)
  );
};

export const updateStoredUser = (user) => {
  if (
    typeof window === "undefined" ||
    !user
  ) {
    return;
  }

  window.localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(user)
  );

  window.dispatchEvent(
    new Event(AUTH_CHANGED_EVENT)
  );
};

export const getStoredUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(
      AUTH_USER_KEY
    );

    if (!stored) {
      return null;
    }

    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  /*
   * Cierre remoto de la cookie HttpOnly. keepalive evita
   * perder la petición si la navegación ocurre enseguida.
   */
  void apiRequest("/auth/logout", {
    method: "POST",
    keepalive: true,
  }).catch(() => null);

  // Limpieza de compatibilidad con sesiones antiguas.
  window.localStorage.removeItem(
    LEGACY_AUTH_TOKEN_KEY
  );
  window.localStorage.removeItem(
    AUTH_USER_KEY
  );

  window.dispatchEvent(
    new Event(AUTH_CHANGED_EVENT)
  );
};
