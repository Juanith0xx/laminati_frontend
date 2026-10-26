"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  assignAdminUserPriceList,
  createAdminUser,
  deleteAdminUser,
  getAdminUserOptions,
  getAdminUserPriceList,
  getAdminUserAuthHistory,
  listAdminPriceListsForUsers,
  listAdminUsers,
  removeAdminUserPriceList,
  setAdminUserStatus,
  updateAdminUser,
} from "@/services/adminUsers.service";

import {
  connectRealtimeSocket,
} from "@/services/realtimeSocket.service";

import PriceListSelector from "@/components/admin/users/PriceListSelector";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  rut: "",
  role: "ADMIN",
  company_id: "",
  position_name: "",
  password: "",
  price_list_id: "",
};

const ROLE_LABELS = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  GERENCIA_ITALIA: "Gerencia Italia",
  CLIENTE: "Cliente",
  USUARIO_EMPRESA: "Usuario empresa",
};

function formatRole(role) {
  return ROLE_LABELS[role] || role || "Sin perfil";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(date);
}

function formatClock(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  }).format(date);
}

function formatRelativeTime(value, now = Date.now()) {
  if (!value) return "Sin actividad registrada";

  const date = new Date(value);
  const time = date.getTime();

  if (Number.isNaN(time)) {
    return "Sin actividad registrada";
  }

  const diffMs = Math.max(0, now - time);
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "hace unos segundos";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;

  return formatDate(value);
}

function formatDuration(fromValue, now = Date.now()) {
  if (!fromValue) return "—";

  const from = new Date(fromValue).getTime();
  if (Number.isNaN(from)) return "—";

  const totalMinutes = Math.max(0, Math.floor((now - from) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} d ${hours} h`;
  }

  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  }

  return `${minutes} min`;
}

function getPresenceDeviceLabel(presence) {
  return [
    presence?.device_type,
    presence?.browser,
    presence?.platform,
  ]
    .filter(Boolean)
    .join(" · ");
}

function getInitials(user) {
  const first = String(user?.first_name || "").trim();
  const last = String(user?.last_name || "").trim();
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "U";
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-neutral-400"
        }`}
      />
      {active ? "Activo" : "Deshabilitado"}
    </span>
  );
}

function PriceListBadge({ name }) {
  if (!name) {
    return (
      <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-500 ring-1 ring-neutral-200">
        Sin lista
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200">
      {name}
    </span>
  );
}

function PresenceIndicator({
  user,
  now,
  onOpen,
  compact = false,
}) {
  const presence = user?.presence || {};
  const isOnline = Boolean(presence.is_online);
  const lastActivity =
    presence.last_seen_at ||
    user?.last_login_at ||
    null;
  const deviceLabel =
    getPresenceDeviceLabel(presence);

  const detailText = isOnline
    ? presence.connected_at
      ? `Desde ${formatClock(presence.connected_at)} · ${formatDuration(
          presence.connected_at,
          now
        )}`
      : "Conectado ahora"
    : `Última actividad ${formatRelativeTime(lastActivity, now)}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group text-left ${compact ? "w-full" : "min-w-[190px]"}`}
      title="Ver detalle de conexión"
    >
      <span className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            isOnline
              ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,.12)]"
              : "bg-neutral-300"
          }`}
        />
        <span
          className={`text-xs font-semibold ${
            isOnline ? "text-emerald-700" : "text-neutral-600"
          }`}
        >
          {isOnline ? "En línea" : "Desconectado"}
        </span>
        {isOnline && Number(presence.active_sessions || 0) > 1 && (
          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
            {presence.active_sessions} sesiones
          </span>
        )}
      </span>

      <span className="mt-1 block text-[11px] leading-4 text-neutral-500">
        {detailText}
      </span>

      {deviceLabel && (
        <span className="mt-0.5 block truncate text-[10px] text-neutral-400 group-hover:text-neutral-600">
          {deviceLabel}
        </span>
      )}
    </button>
  );
}

function PresenceDetailModal({
  user,
  now,
  onClose,
}) {
  if (!user) return null;

  const presence = user.presence || {};
  const isOnline = Boolean(presence.is_online);
  const sessions = Array.isArray(presence.sessions)
    ? presence.sessions
    : [];
  const lastActivity =
    presence.last_seen_at ||
    user.last_login_at ||
    null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de conexión de ${user.first_name} ${user.last_name}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="border-b border-neutral-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                {getInitials(user)}
                <span
                  className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                    isOnline ? "bg-emerald-500" : "bg-neutral-300"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-neutral-950">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="truncate text-xs text-neutral-500">
                  {user.email} · {formatRole(user.role)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-lg text-neutral-500 transition hover:bg-neutral-50 hover:text-black"
              aria-label="Cerrar detalle"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div
            className={`rounded-2xl border p-4 ${
              isOnline
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-neutral-200 bg-neutral-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isOnline ? "bg-emerald-500" : "bg-neutral-300"
                }`}
              />
              <p
                className={`text-sm font-semibold ${
                  isOnline ? "text-emerald-800" : "text-neutral-700"
                }`}
              >
                {isOnline ? "Usuario conectado" : "Usuario desconectado"}
              </p>
            </div>

            <p className="mt-2 text-xs text-neutral-600">
              {isOnline && presence.connected_at
                ? `Conectado desde ${formatDate(
                    presence.connected_at
                  )} · ${formatDuration(presence.connected_at, now)}`
                : `Última actividad ${formatRelativeTime(lastActivity, now)}`}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Último inicio de sesión
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-800">
                {formatDate(user.last_login_at)}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Sesiones activas
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-800">
                {Number(presence.active_sessions || 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Dispositivo
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-800">
                {presence.device_type || "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Navegador / sistema
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-800">
                {[presence.browser, presence.platform]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
            </div>
          </div>

          {isOnline && sessions.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Sesiones conectadas
              </p>
              <div className="mt-2 space-y-2">
                {sessions.map((session, index) => (
                  <div
                    key={`${session.connected_at || "session"}-${index}`}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-neutral-50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-neutral-800">
                        {[session.device_type, session.browser, session.platform]
                          .filter(Boolean)
                          .join(" · ") || "Sesión"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-neutral-400">
                        Conectada desde {formatDate(session.connected_at)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                      En línea
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


const AUTH_EVENT_LABELS = {
  LOGIN_SUCCESS: "Inicio de sesión",
  LOGIN_FAILED: "Intento fallido",
  LOGOUT: "Cierre de sesión",
};

const AUTH_FAILURE_LABELS = {
  INVALID_LOGIN_PAYLOAD: "Datos de acceso inválidos",
  USER_NOT_FOUND: "Usuario no encontrado",
  INVALID_PASSWORD: "Contraseña incorrecta",
  ACCOUNT_DISABLED: "Cuenta deshabilitada",
  LOGIN_PROCESS_ERROR: "Error durante el inicio de sesión",
  RATE_LIMITED: "Demasiados intentos de acceso",
};

function formatAuthEventLabel(eventType) {
  return AUTH_EVENT_LABELS[eventType] || eventType || "Evento";
}

function formatAuthFailureReason(reason) {
  return AUTH_FAILURE_LABELS[reason] || reason || null;
}

function getAuthEventAppearance(eventType) {
  if (eventType === "LOGIN_SUCCESS") {
    return {
      dot: "bg-emerald-500",
      badge:
        "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      symbol: "✓",
    };
  }

  if (eventType === "LOGIN_FAILED") {
    return {
      dot: "bg-red-500",
      badge: "bg-red-50 text-red-700 ring-1 ring-red-200",
      symbol: "!",
    };
  }

  return {
    dot: "bg-neutral-400",
    badge: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
    symbol: "↪",
  };
}

function AuthHistoryModal({
  user,
  onClose,
}) {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({
    total_events: 0,
    login_success: 0,
    login_failed: 0,
    logout: 0,
    distinct_users: 0,
    last_event_at: null,
    last_login_success_at: null,
    last_login_failed_at: null,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  });
  const [filters, setFilters] = useState({
    event_type: "ALL",
    date_from: "",
    date_to: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(
    async (page = 1, signal) => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError("");

        const response = await getAdminUserAuthHistory(
          user.id,
          {
            event_type:
              filters.event_type === "ALL"
                ? ""
                : filters.event_type,
            date_from: filters.date_from,
            date_to: filters.date_to,
            page,
            limit: 10,
          },
          {
            signal,
          }
        );

        setEvents(
          Array.isArray(response?.data)
            ? response.data
            : []
        );

        setSummary(
          response?.summary || {
            total_events: 0,
            login_success: 0,
            login_failed: 0,
            logout: 0,
            distinct_users: 0,
            last_event_at: null,
            last_login_success_at: null,
            last_login_failed_at: null,
          }
        );

        setPagination(
          response?.pagination || {
            page,
            limit: 10,
            total: 0,
            total_pages: 1,
          }
        );
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        setError(
          requestError?.message ||
            "No fue posible cargar el historial de accesos."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [
      user?.id,
      filters.event_type,
      filters.date_from,
      filters.date_to,
    ]
  );

  useEffect(() => {
    if (!user?.id) return undefined;

    const controller = new AbortController();
    loadHistory(1, controller.signal);

    return () => {
      controller.abort();
    };
  }, [user?.id, loadHistory]);

  useEffect(() => {
    if (!user?.id) {
      setEvents([]);
      setError("");
      setFilters({
        event_type: "ALL",
        date_from: "",
        date_to: "",
      });
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 1,
      });
    }
  }, [user?.id]);

  if (!user) return null;

  const resetFilters = () => {
    setFilters({
      event_type: "ALL",
      date_from: "",
      date_to: "",
    });
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-3 backdrop-blur-[2px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Historial de accesos de ${user.first_name} ${user.last_name}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="border-b border-neutral-100 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                {getInitials(user)}
                <span
                  className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                    user.presence?.is_online
                      ? "bg-emerald-500"
                      : "bg-neutral-300"
                  }`}
                />
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Historial de accesos
                </p>
                <h3 className="truncate text-lg font-semibold text-neutral-950">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="truncate text-xs text-neutral-500">
                  {user.email} · {formatRole(user.role)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-lg text-neutral-500 transition hover:bg-neutral-50 hover:text-black"
              aria-label="Cerrar historial"
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-y-auto">
          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-neutral-200 p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                  Accesos exitosos
                </p>
                <p className="mt-2 text-2xl font-semibold text-emerald-700">
                  {Number(summary.login_success || 0)}
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                  Intentos fallidos
                </p>
                <p className="mt-2 text-2xl font-semibold text-red-600">
                  {Number(summary.login_failed || 0)}
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                  Cierres de sesión
                </p>
                <p className="mt-2 text-2xl font-semibold text-neutral-800">
                  {Number(summary.logout || 0)}
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                  Último acceso
                </p>
                <p className="mt-2 text-xs font-semibold leading-5 text-neutral-800">
                  {formatDate(summary.last_login_success_at)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    Evento
                  </span>
                  <select
                    value={filters.event_type}
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        event_type: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none focus:border-black"
                  >
                    <option value="ALL">Todos</option>
                    <option value="LOGIN_SUCCESS">Inicios exitosos</option>
                    <option value="LOGIN_FAILED">Intentos fallidos</option>
                    <option value="LOGOUT">Cierres de sesión</option>
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    Desde
                  </span>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        date_from: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none focus:border-black"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    Hasta
                  </span>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(event) =>
                      setFilters((previous) => ({
                        ...previous,
                        date_to: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none focus:border-black"
                  />
                </label>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-10 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-neutral-200">
              <div className="flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Eventos registrados
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {pagination.total || 0} evento
                    {Number(pagination.total || 0) === 1 ? "" : "s"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadHistory(pagination.page || 1)}
                  disabled={loading}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-[10px] font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
                >
                  Actualizar
                </button>
              </div>

              {loading ? (
                <div className="flex min-h-40 items-center justify-center px-4 py-8 text-xs text-neutral-500">
                  Cargando historial...
                </div>
              ) : events.length === 0 ? (
                <div className="flex min-h-40 flex-col items-center justify-center px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-neutral-700">
                    Sin eventos para mostrar
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    No hay registros que coincidan con los filtros seleccionados.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {events.map((event) => {
                    const appearance =
                      getAuthEventAppearance(event.event_type);
                    const failureLabel =
                      formatAuthFailureReason(event.failure_reason);

                    return (
                      <article
                        key={event.id}
                        className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(150px,.8fr)_minmax(180px,1.2fr)_minmax(160px,1fr)] sm:items-center"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${appearance.dot}`}
                          />
                          <div>
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-[9px] font-semibold ${appearance.badge}`}
                            >
                              {appearance.symbol}{" "}
                              {formatAuthEventLabel(event.event_type)}
                            </span>
                            <p className="mt-1.5 text-[11px] font-medium text-neutral-700">
                              {formatDate(event.created_at)}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-neutral-800">
                            {[
                              event.device_type,
                              event.browser,
                              event.operating_system,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Dispositivo no identificado"}
                          </p>

                          {failureLabel && (
                            <p className="mt-1 text-[10px] font-medium text-red-600">
                              {failureLabel}
                            </p>
                          )}

                          <p className="mt-1 truncate text-[10px] text-neutral-400">
                            {event.user_agent || "User-Agent no disponible"}
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                            Dirección IP
                          </p>
                          <p className="mt-1 font-mono text-[11px] text-neutral-700">
                            {event.ip_address || "—"}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {!loading && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/60 px-4 py-3">
                  <p className="text-[10px] text-neutral-500">
                    Página {pagination.page} de {pagination.total_pages}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pagination.page <= 1}
                      onClick={() =>
                        loadHistory(pagination.page - 1)
                      }
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Anterior
                    </button>

                    <button
                      type="button"
                      disabled={
                        pagination.page >=
                        pagination.total_pages
                      }
                      onClick={() =>
                        loadHistory(pagination.page + 1)
                      }
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[10px] leading-4 text-neutral-400">
              Las fechas se muestran en horario de Chile. El historial no almacena
              contraseñas, cookies ni tokens de autenticación.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, caption }) {
  return (
    <article className="rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-black">
        {value}
      </p>
      <p className="mt-1 text-xs text-neutral-500">{caption}</p>
    </article>
  );
}


function EditIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}


function HistoryIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function UserStatusSwitch({ active, onClick, disabled = false }) {
  const label = active ? "Deshabilitar usuario" : "Habilitar usuario";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex h-8 w-[54px] shrink-0 items-center rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 ${
        active
          ? "border-emerald-500 bg-emerald-500"
          : "border-neutral-300 bg-neutral-300"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          active ? "translate-x-[26px]" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function DeleteIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function ActionIconButton({
  label,
  icon,
  tone = "neutral",
  onClick,
  disabled = false,
}) {
  const toneClassName =
    tone === "danger"
      ? "border-red-200 text-red-500 hover:border-red-300 hover:bg-red-50"
      : tone === "success"
        ? "border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50"
        : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-white transition ${toneClassName} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span className="sr-only">{label}</span>
      {icon}
    </button>
  );
}

function UserFormModal({
  open,
  mode,
  user,
  roles,
  companies,
  priceLists,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingPriceList, setLoadingPriceList] = useState(false);
  const [originalPriceListId, setOriginalPriceListId] = useState("");
  const [persistedUserId, setPersistedUserId] = useState(null);

  useEffect(() => {
    if (!open) return;

    let active = true;

    setPersistedUserId(null);
    setOriginalPriceListId("");
    setLoadingPriceList(false);

    if (mode === "edit" && user) {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        rut: user.rut || "",
        role: user.role || "ADMIN",
        company_id: user.company_id || "",
        position_name: user.position_name || "",
        password: "",
        price_list_id: user.price_list_id || "",
      });

      const loadAssignment = async () => {
        try {
          setLoadingPriceList(true);
          const response = await getAdminUserPriceList(user.id);
          const assignedPriceListId = response?.data?.price_list_id || "";

          if (!active) return;

          setOriginalPriceListId(assignedPriceListId);
          setForm((previous) => ({
            ...previous,
            price_list_id: assignedPriceListId,
          }));
        } catch {
          if (!active) return;

          setOriginalPriceListId(user.price_list_id || "");
        } finally {
          if (active) {
            setLoadingPriceList(false);
          }
        }
      };

      loadAssignment();
    } else {
      setForm(EMPTY_FORM);
    }

    setError("");

    return () => {
      active = false;
    };
  }, [open, mode, user]);

  if (!open) return null;

  const isCompanyUser = form.role === "USUARIO_EMPRESA";
  const isCommercialCustomer = ["CLIENTE", "USUARIO_EMPRESA"].includes(
    form.role
  );

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "role" && value !== "USUARIO_EMPRESA"
        ? {
            company_id: "",
            position_name: "",
          }
        : {}),
      ...(field === "role" &&
      !["CLIENTE", "USUARIO_EMPRESA"].includes(value)
        ? {
            price_list_id: "",
          }
        : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("Nombre y apellido son obligatorios.");
      return;
    }

    if (!form.email.trim()) {
      setError("El correo electrónico es obligatorio.");
      return;
    }

    if (mode === "create" && form.password.length < 8) {
      setError("La contraseña inicial debe tener al menos 8 caracteres.");
      return;
    }

    if (mode === "edit" && form.password && form.password.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (isCompanyUser && !form.company_id) {
      setError("Selecciona la empresa asociada al usuario.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        rut: form.rut.trim() || null,
        role: form.role,
        company_id: isCompanyUser ? form.company_id : null,
        position_name: isCompanyUser
          ? form.position_name.trim() || null
          : null,
        ...(form.password ? { password: form.password } : {}),
      };

      let targetUserId = mode === "edit" ? user.id : persistedUserId;

      if (mode === "create" && !persistedUserId) {
        const created = await createAdminUser(payload);
        targetUserId = created?.data?.id || null;

        if (!targetUserId) {
          throw new Error(
            "El usuario fue creado, pero no fue posible obtener su identificador."
          );
        }

        setPersistedUserId(targetUserId);
      } else {
        await updateAdminUser(targetUserId, payload);
      }

      const desiredPriceListId = isCommercialCustomer
        ? form.price_list_id || ""
        : "";

      if (desiredPriceListId !== originalPriceListId) {
        if (desiredPriceListId) {
          await assignAdminUserPriceList(
            targetUserId,
            desiredPriceListId
          );
        } else if (originalPriceListId) {
          await removeAdminUserPriceList(targetUserId);
        }

        setOriginalPriceListId(desiredPriceListId);
      }

      await onSaved();
      onClose();
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No fue posible guardar el usuario y sus condiciones comerciales."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={saving ? undefined : onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-neutral-100 bg-white/95 px-6 py-5 backdrop-blur sm:px-7">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Laminati · Usuarios
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-black">
              {mode === "create" ? "Crear usuario" : "Editar usuario"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {mode === "create"
                ? "Crea una cuenta y define su perfil de acceso."
                : "Actualiza los datos de la cuenta seleccionada."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>

        <div className="space-y-6 p-6 sm:p-7">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700">Nombre</span>
              <input
                value={form.first_name}
                onChange={(event) =>
                  updateField("first_name", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                placeholder="Nombre"
                autoComplete="off"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700">Apellido</span>
              <input
                value={form.last_name}
                onChange={(event) =>
                  updateField("last_name", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                placeholder="Apellido"
                autoComplete="off"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold text-neutral-700">Correo electrónico</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                placeholder="usuario@laminatiword.cl"
                autoComplete="off"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700">RUT</span>
              <input
                value={form.rut}
                onChange={(event) =>
                  updateField("rut", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                placeholder="12.345.678-9"
                autoComplete="off"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700">Teléfono</span>
              <input
                value={form.phone}
                onChange={(event) =>
                  updateField("phone", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                placeholder="+56 9 ..."
                autoComplete="off"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700">Perfil</span>
              <select
                value={form.role}
                onChange={(event) =>
                  updateField("role", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {formatRole(role.name)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700">
                {mode === "create" ? "Contraseña inicial" : "Nueva contraseña"}
              </span>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                placeholder={
                  mode === "create"
                    ? "Mínimo 8 caracteres"
                    : "Déjala vacía para conservarla"
                }
                autoComplete="new-password"
              />
            </label>
          </div>

          {isCompanyUser && (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Asociación empresa
              </p>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-700">Empresa</span>
                  <select
                    value={form.company_id}
                    onChange={(event) =>
                      updateField("company_id", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
                  >
                    <option value="">Seleccionar empresa</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.trade_name || company.legal_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-700">Cargo / referencia</span>
                  <input
                    value={form.position_name}
                    onChange={(event) =>
                      updateField("position_name", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
                    placeholder="Ej. Compras"
                  />
                </label>
              </div>
            </div>
          )}

          {isCommercialCustomer && (
            <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500">
                Condiciones comerciales
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Asigna una lista de precios al cliente. La lista define descuentos
                comerciales por producto o colección.
              </p>

              <div className="mt-4">
                <PriceListSelector
                  priceLists={priceLists}
                  value={form.price_list_id}
                  onChange={(value) =>
                    updateField("price_list_id", value)
                  }
                  disabled={saving || loadingPriceList}
                  loading={loadingPriceList}
                />
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-xs leading-5 text-neutral-500">
            Deshabilitar conserva la cuenta y su historial. Eliminar utiliza eliminación lógica para mantener pedidos, pagos y trazabilidad comercial.
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-xl border border-neutral-200 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Guardando..."
                : mode === "create"
                  ? "Crear usuario"
                  : "Guardar cambios"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ConfirmationModal({ action, onClose, onConfirm, busy }) {
  if (!action) return null;

  const isDelete = action.type === "delete";
  const isEnable = action.type === "enable";

  const title = isDelete
    ? "Eliminar usuario"
    : isEnable
      ? "Habilitar usuario"
      : "Deshabilitar usuario";

  const description = isDelete
    ? "La cuenta dejará de aparecer en la gestión de usuarios, pero su historial comercial se conservará."
    : isEnable
      ? "El usuario podrá volver a iniciar sesión con sus credenciales."
      : "El usuario no podrá iniciar una nueva sesión mientras permanezca deshabilitado.";

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar confirmación"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={busy ? undefined : onClose}
      />

      <div className="relative w-full max-w-md rounded-[26px] bg-white p-6 shadow-2xl sm:p-7">
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Confirmación
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-black">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          {description}
        </p>

        <div className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3">
          <p className="font-semibold text-neutral-900">
            {action.user.first_name} {action.user.last_name}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {action.user.email}
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-11 rounded-xl border border-neutral-200 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-11 rounded-xl px-5 text-sm font-semibold text-white transition disabled:opacity-50 ${
              isDelete || action.type === "disable"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-black hover:bg-neutral-800"
            }`}
          >
            {busy ? "Procesando..." : title}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [priceLists, setPriceLists] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "ALL",
    status: "ALL",
  });
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [action, setAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [presenceDetailUserId, setPresenceDetailUserId] = useState(null);
  const [authHistoryUserId, setAuthHistoryUserId] = useState(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const loadOptions = useCallback(async () => {
    const [userOptions, priceListResponse] = await Promise.all([
      getAdminUserOptions(),
      listAdminPriceListsForUsers(),
    ]);

    setRoles(userOptions?.roles || []);
    setCompanies(userOptions?.companies || []);
    setPriceLists(priceListResponse?.data || []);
  }, []);

  const loadUsers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError("");

        const response = await listAdminUsers({
          search: filters.search,
          role: filters.role,
          status: filters.status,
          page,
          limit: 20,
        });

        const baseUsers = response?.data || [];

        const enrichedUsers = await Promise.all(
          baseUsers.map(async (user) => {
            if (!["CLIENTE", "USUARIO_EMPRESA"].includes(user.role)) {
              return {
                ...user,
                price_list_id: null,
                price_list_name: null,
                price_list_assignment: null,
              };
            }

            try {
              const assignmentResponse =
                await getAdminUserPriceList(user.id);
              const assignment = assignmentResponse?.data || null;

              return {
                ...user,
                price_list_id: assignment?.price_list_id || null,
                price_list_name:
                  assignment?.price_list_name || null,
                price_list_assignment: assignment,
              };
            } catch {
              return {
                ...user,
                price_list_id: null,
                price_list_name: null,
                price_list_assignment: null,
              };
            }
          })
        );

        setUsers(enrichedUsers);
        setSummary(
          response?.summary || {
            total: 0,
            active: 0,
            inactive: 0,
            admins: 0,
          }
        );
        setPagination(
          response?.pagination || {
            page: 1,
            total_pages: 1,
            total: 0,
          }
        );
      } catch (requestError) {
        setError(
          requestError?.message ||
            "No fue posible cargar los usuarios."
        );
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    loadOptions().catch((requestError) => {
      setError(
        requestError?.message ||
          "No fue posible cargar las opciones de usuarios."
      );
    });
  }, [loadOptions]);

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  useEffect(() => {
    const socket = connectRealtimeSocket();

    if (!socket) {
      return undefined;
    }

    const handlePresenceUpdate = (payload) => {
      const userId = String(payload?.user_id || "");

      if (!userId || !payload?.presence) {
        return;
      }

      setUsers((current) =>
        current.map((user) =>
          String(user.id) === userId
            ? {
                ...user,
                presence: payload.presence,
              }
            : user
        )
      );
    };

    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((previous) => ({
        ...previous,
        search: searchInput.trim(),
      }));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const roleOptions = useMemo(
    () => roles.map((role) => ({
      value: role.name,
      label: formatRole(role.name),
    })),
    [roles]
  );

  const presenceDetailUser = useMemo(
    () =>
      users.find(
        (user) => String(user.id) === String(presenceDetailUserId || "")
      ) || null,
    [users, presenceDetailUserId]
  );

  const authHistoryUser = useMemo(
    () =>
      users.find(
        (user) => String(user.id) === String(authHistoryUserId || "")
      ) || null,
    [users, authHistoryUserId]
  );

  const handleRefresh = async () => {
    await Promise.all([
      loadOptions(),
      loadUsers(pagination.page || 1),
    ]);
  };

  const handleConfirmedAction = async () => {
    if (!action?.user?.id) return;

    try {
      setActionBusy(true);
      setError("");

      if (action.type === "delete") {
        await deleteAdminUser(action.user.id);
      } else {
        await setAdminUserStatus(
          action.user.id,
          action.type === "enable"
        );
      }

      setAction(null);
      await loadUsers(pagination.page || 1);
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No fue posible completar la acción."
      );
      setAction(null);
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,.05)]">
        <div className="h-[3px] bg-gradient-to-r from-red-400 via-pink-400 to-violet-600" />
        <div className="flex flex-col gap-5 px-6 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              Laminati · Backoffice
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-black">
              Usuarios
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Crea, edita, habilita, deshabilita y elimina cuentas desde un solo lugar.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleRefresh}
              className="h-11 rounded-full border border-black/10 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => setModal({ mode: "create", user: null })}
              className="h-11 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              + Crear usuario
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Usuarios"
          value={summary.total || 0}
          caption="Cuentas visibles"
        />
        <MetricCard
          label="Activos"
          value={summary.active || 0}
          caption="Pueden iniciar sesión"
        />
        <MetricCard
          label="Deshabilitados"
          value={summary.inactive || 0}
          caption="Acceso suspendido"
        />
        <MetricCard
          label="Administradores"
          value={summary.admins || 0}
          caption="Perfil ADMIN"
        />
      </section>

      <section className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_.6fr_.6fr_auto] lg:items-end">
          <label className="space-y-2">
            <span className="text-xs font-semibold text-neutral-700">
              Buscar usuario
            </span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Nombre, correo o RUT..."
              className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold text-neutral-700">Perfil</span>
            <select
              value={filters.role}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  role: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
            >
              <option value="ALL">Todos</option>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold text-neutral-700">Estado</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  status: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Deshabilitados</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setFilters({
                search: "",
                role: "ALL",
                status: "ALL",
              });
            }}
            className="h-11 rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
          >
            Limpiar
          </button>
        </div>
      </section>

      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </section>
      )}

      <section className="overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-black">Usuarios registrados</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              {pagination.total || 0} resultado{pagination.total === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center text-sm text-neutral-500">
            Cargando usuarios...
          </div>
        ) : users.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-xl">
              👤
            </div>
            <p className="mt-4 font-semibold text-neutral-900">Sin usuarios para mostrar</p>
            <p className="mt-1 text-sm text-neutral-500">
              Cambia los filtros o crea una nueva cuenta.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1390px] border-collapse text-left">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    <th className="px-6 py-3.5">Usuario</th>
                    <th className="px-4 py-3.5">Perfil</th>
                    <th className="px-4 py-3.5">Empresa</th>
                    <th className="px-4 py-3.5">Lista de precios</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-4 py-3.5">Conexión</th>
                    <th className="px-4 py-3.5 text-center">Acceso</th>
                    <th className="px-4 py-3.5">Último acceso</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {users.map((user) => (
                    <tr key={user.id} className="transition hover:bg-neutral-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                            {getInitials(user)}
                            <span
                              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                                user.presence?.is_online
                                  ? "bg-emerald-500"
                                  : "bg-neutral-300"
                              }`}
                              title={
                                user.presence?.is_online
                                  ? "En línea"
                                  : "Desconectado"
                              }
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-neutral-900">
                                {user.first_name} {user.last_name}
                              </p>
                              {user.is_self && (
                                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                  Tú
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-neutral-500">
                              {user.email}
                              {user.rut ? ` · ${user.rut}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-700">
                        {formatRole(user.role)}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">
                        {user.company_name || "—"}
                      </td>
                      <td className="px-4 py-4">
                        {["CLIENTE", "USUARIO_EMPRESA"].includes(user.role) ? (
                          <PriceListBadge name={user.price_list_name} />
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge active={user.is_active} />
                      </td>
                      <td className="px-4 py-4">
                        <PresenceIndicator
                          user={user}
                          now={nowTick}
                          onOpen={() => setPresenceDetailUserId(user.id)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div
                          className="flex justify-center"
                          title={user.is_self ? "Tu propia cuenta no puede deshabilitarse" : undefined}
                        >
                          <UserStatusSwitch
                            active={user.is_active}
                            disabled={user.is_self}
                            onClick={() =>
                              !user.is_self &&
                              setAction({
                                type: user.is_active ? "disable" : "enable",
                                user,
                              })
                            }
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-neutral-500">
                        {formatDate(user.last_login_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionIconButton
                            label="Historial de accesos"
                            onClick={() => setAuthHistoryUserId(user.id)}
                            icon={<HistoryIcon className="h-5 w-5" />}
                          />

                          <ActionIconButton
                            label="Editar usuario"
                            onClick={() => setModal({ mode: "edit", user })}
                            icon={<EditIcon className="h-5 w-5" />}
                          />

                          {!user.is_self && (
                            <ActionIconButton
                              label="Eliminar usuario"
                              onClick={() => setAction({ type: "delete", user })}
                              tone="danger"
                              icon={<DeleteIcon className="h-5 w-5" />}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-neutral-100 lg:hidden">
              {users.map((user) => (
                <article key={user.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                      {getInitials(user)}
                      <span
                        className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                          user.presence?.is_online
                            ? "bg-emerald-500"
                            : "bg-neutral-300"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-neutral-900">
                          {user.first_name} {user.last_name}
                        </p>
                        {user.is_self && (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                            Tú
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 break-all text-xs text-neutral-500">
                        {user.email}
                      </p>
                    </div>
                    <StatusBadge active={user.is_active} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-neutral-50 p-4 text-xs">
                    <div>
                      <p className="text-neutral-400">Perfil</p>
                      <p className="mt-1 font-semibold text-neutral-700">
                        {formatRole(user.role)}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-400">Último acceso</p>
                      <p className="mt-1 font-semibold text-neutral-700">
                        {formatDate(user.last_login_at)}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-xl border border-neutral-200 bg-white p-3">
                      <p className="mb-2 text-neutral-400">Conexión</p>
                      <PresenceIndicator
                        user={user}
                        now={nowTick}
                        compact
                        onOpen={() => setPresenceDetailUserId(user.id)}
                      />
                    </div>
                    {user.company_name && (
                      <div className="col-span-2">
                        <p className="text-neutral-400">Empresa</p>
                        <p className="mt-1 font-semibold text-neutral-700">
                          {user.company_name}
                        </p>
                      </div>
                    )}
                    {["CLIENTE", "USUARIO_EMPRESA"].includes(user.role) && (
                      <div className="col-span-2">
                        <p className="text-neutral-400">Lista de precios</p>
                        <div className="mt-1">
                          <PriceListBadge name={user.price_list_name} />
                        </div>
                      </div>
                    )}
                    <div className="col-span-2 flex items-center justify-between border-t border-neutral-200 pt-3">
                      <div>
                        <p className="text-neutral-400">Acceso</p>
                        <p className="mt-1 font-semibold text-neutral-700">
                          {user.is_active ? "Habilitado" : "Deshabilitado"}
                        </p>
                      </div>
                      <div title={user.is_self ? "Tu propia cuenta no puede deshabilitarse" : undefined}>
                        <UserStatusSwitch
                          active={user.is_active}
                          disabled={user.is_self}
                          onClick={() =>
                            !user.is_self &&
                            setAction({
                              type: user.is_active ? "disable" : "enable",
                              user,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <ActionIconButton
                      label="Historial de accesos"
                      onClick={() => setAuthHistoryUserId(user.id)}
                      icon={<HistoryIcon className="h-5 w-5" />}
                    />

                    <ActionIconButton
                      label="Editar usuario"
                      onClick={() => setModal({ mode: "edit", user })}
                      icon={<EditIcon className="h-5 w-5" />}
                    />
                    {!user.is_self && (
                      <ActionIconButton
                        label="Eliminar usuario"
                        onClick={() => setAction({ type: "delete", user })}
                        tone="danger"
                        icon={<DeleteIcon className="h-5 w-5" />}
                      />
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {!loading && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-4 sm:px-6">
            <p className="text-xs text-neutral-500">
              Página {pagination.page} de {pagination.total_pages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => loadUsers(pagination.page - 1)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => loadUsers(pagination.page + 1)}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </section>

      <PresenceDetailModal
        user={presenceDetailUser}
        now={nowTick}
        onClose={() => setPresenceDetailUserId(null)}
      />

      <AuthHistoryModal
        user={authHistoryUser}
        onClose={() => setAuthHistoryUserId(null)}
      />

      <UserFormModal
        open={Boolean(modal)}
        mode={modal?.mode || "create"}
        user={modal?.user || null}
        roles={roles}
        companies={companies}
        priceLists={priceLists}
        onClose={() => setModal(null)}
        onSaved={() => loadUsers(pagination.page || 1)}
      />

      <ConfirmationModal
        action={action}
        busy={actionBusy}
        onClose={() => setAction(null)}
        onConfirm={handleConfirmedAction}
      />
    </main>
  );
}