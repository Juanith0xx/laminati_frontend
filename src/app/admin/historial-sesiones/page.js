"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  listAdminAuthHistory,
} from "@/services/adminUsers.service";

const EMPTY_SUMMARY = {
  total_events: 0,
  login_success: 0,
  login_failed: 0,
  logout: 0,
  distinct_users: 0,
  last_event_at: null,
  last_login_success_at: null,
  last_login_failed_at: null,
};

const EMPTY_PAGINATION = {
  page: 1,
  limit: 25,
  total: 0,
  total_pages: 1,
};

const EVENT_LABELS = {
  LOGIN_SUCCESS: "Inicio de sesión",
  LOGIN_FAILED: "Intento fallido",
  LOGOUT: "Cierre de sesión",
};

const FAILURE_LABELS = {
  INVALID_LOGIN_PAYLOAD: "Datos de acceso inválidos",
  USER_NOT_FOUND: "Usuario no encontrado",
  INVALID_PASSWORD: "Contraseña incorrecta",
  ACCOUNT_DISABLED: "Cuenta deshabilitada",
  LOGIN_PROCESS_ERROR: "Error durante el inicio de sesión",
  RATE_LIMITED: "Demasiados intentos de acceso",
};

const ROLE_LABELS = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  GERENCIA_ITALIA: "Gerencia Italia",
  CLIENTE: "Cliente",
  USUARIO_EMPRESA: "Usuario empresa",
};

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

function formatEvent(eventType) {
  return EVENT_LABELS[eventType] || eventType || "Evento";
}

function formatFailure(reason) {
  return FAILURE_LABELS[reason] || reason || "—";
}

function formatRole(role) {
  return ROLE_LABELS[role] || role || "Sin perfil";
}

function getEventStyle(eventType) {
  if (eventType === "LOGIN_SUCCESS") {
    return {
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      dot: "bg-emerald-500",
    };
  }

  if (eventType === "LOGIN_FAILED") {
    return {
      badge: "bg-red-50 text-red-700 ring-red-200",
      dot: "bg-red-500",
    };
  }

  return {
    badge: "bg-neutral-100 text-neutral-700 ring-neutral-200",
    dot: "bg-neutral-400",
  };
}

function StatCard({ label, value, detail, tone = "neutral" }) {
  const tones = {
    neutral: "text-neutral-950",
    success: "text-emerald-700",
    danger: "text-red-600",
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${tones[tone] || tones.neutral}`}>
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-[10px] text-neutral-400">{detail}</p>
      ) : null}
    </div>
  );
}

export default function AdminSessionHistoryPage() {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    event_type: "ALL",
    success: "ALL",
    device_type: "ALL",
    date_from: "",
    date_to: "",
  });

  const loadHistory = useCallback(
    async (page = 1, signal) => {
      try {
        setLoading(true);
        setError("");

        const response = await listAdminAuthHistory(
          {
            search: filters.search,
            event_type:
              filters.event_type === "ALL"
                ? ""
                : filters.event_type,
            success:
              filters.success === "ALL"
                ? ""
                : filters.success,
            device_type:
              filters.device_type === "ALL"
                ? ""
                : filters.device_type,
            date_from: filters.date_from,
            date_to: filters.date_to,
            page,
            limit: 25,
          },
          { signal }
        );

        setEvents(Array.isArray(response?.data) ? response.data : []);
        setSummary(response?.summary || EMPTY_SUMMARY);
        setPagination(response?.pagination || {
          ...EMPTY_PAGINATION,
          page,
        });
      } catch (requestError) {
        if (requestError?.name === "AbortError") return;

        setError(
          requestError?.message ||
            "No fue posible cargar el historial de sesiones."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [filters]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadHistory(1, controller.signal);

    return () => controller.abort();
  }, [loadHistory]);

  const hasFilters = useMemo(
    () =>
      Boolean(
        filters.search ||
          filters.event_type !== "ALL" ||
          filters.success !== "ALL" ||
          filters.device_type !== "ALL" ||
          filters.date_from ||
          filters.date_to
      ),
    [filters]
  );

  const applySearch = (event) => {
    event.preventDefault();
    setFilters((previous) => ({
      ...previous,
      search: searchInput.trim(),
    }));
  };

  const clearFilters = () => {
    setSearchInput("");
    setFilters({
      search: "",
      event_type: "ALL",
      success: "ALL",
      device_type: "ALL",
      date_from: "",
      date_to: "",
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Administración · Seguridad
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              Historial de Sesiones
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              Auditoría de inicios de sesión, intentos fallidos y cierres de sesión registrados en Laminatiword.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadHistory(pagination.page || 1)}
            disabled={loading}
            className="h-10 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-100 disabled:opacity-50"
          >
            Actualizar
          </button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Eventos"
            value={Number(summary.total_events || 0)}
            detail={`${Number(summary.distinct_users || 0)} usuarios distintos`}
          />
          <StatCard
            label="Accesos exitosos"
            value={Number(summary.login_success || 0)}
            detail={formatDate(summary.last_login_success_at)}
            tone="success"
          />
          <StatCard
            label="Intentos fallidos"
            value={Number(summary.login_failed || 0)}
            detail={formatDate(summary.last_login_failed_at)}
            tone="danger"
          />
          <StatCard
            label="Cierres"
            value={Number(summary.logout || 0)}
          />
          <StatCard
            label="Último evento"
            value={summary.last_event_at ? "Registrado" : "—"}
            detail={formatDate(summary.last_event_at)}
          />
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <form
            onSubmit={applySearch}
            className="grid gap-3 xl:grid-cols-[minmax(220px,1.4fr)_repeat(5,minmax(130px,.8fr))_auto] xl:items-end"
          >
            <label className="space-y-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Usuario, correo o IP
              </span>
              <div className="flex gap-2">
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Buscar..."
                  className="h-10 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none transition focus:border-black"
                />
                <button
                  type="submit"
                  className="h-10 rounded-xl bg-black px-4 text-xs font-semibold text-white transition hover:bg-neutral-800"
                >
                  Buscar
                </button>
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
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
                <option value="LOGIN_SUCCESS">Inicio exitoso</option>
                <option value="LOGIN_FAILED">Intento fallido</option>
                <option value="LOGOUT">Cierre de sesión</option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Resultado
              </span>
              <select
                value={filters.success}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    success: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none focus:border-black"
              >
                <option value="ALL">Todos</option>
                <option value="true">Exitoso</option>
                <option value="false">Fallido</option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Dispositivo
              </span>
              <select
                value={filters.device_type}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    device_type: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none focus:border-black"
              >
                <option value="ALL">Todos</option>
                <option value="DESKTOP">Desktop</option>
                <option value="MOBILE">Móvil</option>
                <option value="TABLET">Tablet</option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
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
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
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
              onClick={clearFilters}
              disabled={!hasFilters && !searchInput}
              className="h-10 rounded-xl border border-neutral-200 px-4 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
            >
              Limpiar
            </button>
          </form>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-neutral-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-950">
                Eventos registrados
              </h2>
              <p className="mt-0.5 text-[10px] text-neutral-400">
                {Number(pagination.total || 0)} registro{Number(pagination.total || 0) === 1 ? "" : "s"}
              </p>
            </div>
            <p className="text-[10px] text-neutral-400">
              Horario mostrado: Chile continental
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center px-5 py-10 text-sm text-neutral-500">
              Cargando historial de sesiones...
            </div>
          ) : events.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center">
              <p className="text-sm font-semibold text-neutral-700">
                Sin eventos para mostrar
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                No existen registros que coincidan con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px] border-collapse text-left">
                  <thead className="bg-neutral-50/80">
                    <tr className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3">Usuario</th>
                      <th className="px-5 py-3">Evento</th>
                      <th className="px-5 py-3">Dispositivo</th>
                      <th className="px-5 py-3">Navegador / SO</th>
                      <th className="px-5 py-3">IP</th>
                      <th className="px-5 py-3">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {events.map((event) => {
                      const style = getEventStyle(event.event_type);
                      const fullName = [event.first_name, event.last_name]
                        .filter(Boolean)
                        .join(" ") || "Usuario no disponible";

                      return (
                        <tr key={event.id} className="align-top text-xs text-neutral-600 hover:bg-neutral-50/50">
                          <td className="whitespace-nowrap px-5 py-4 font-medium text-neutral-700">
                            {formatDate(event.created_at)}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-neutral-900">{fullName}</p>
                            <p className="mt-0.5 max-w-[220px] truncate text-[10px] text-neutral-400">{event.email || "—"}</p>
                            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-neutral-400">{formatRole(event.role)}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${style.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                              {formatEvent(event.event_type)}
                            </span>
                          </td>
                          <td className="px-5 py-4">{event.device_type || "—"}</td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-neutral-700">{event.browser || "—"}</p>
                            <p className="mt-0.5 text-[10px] text-neutral-400">{event.operating_system || "—"}</p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 font-mono text-[10px] text-neutral-500">{event.ip_address || "—"}</td>
                          <td className="px-5 py-4">
                            <p className={event.failure_reason ? "font-medium text-red-600" : "text-neutral-400"}>
                              {event.failure_reason ? formatFailure(event.failure_reason) : "—"}
                            </p>
                            <p className="mt-1 max-w-[250px] truncate text-[9px] text-neutral-300" title={event.user_agent || ""}>
                              {event.user_agent || ""}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-neutral-100 lg:hidden">
                {events.map((event) => {
                  const style = getEventStyle(event.event_type);
                  const fullName = [event.first_name, event.last_name]
                    .filter(Boolean)
                    .join(" ") || "Usuario no disponible";

                  return (
                    <article key={event.id} className="space-y-3 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-neutral-900">{fullName}</p>
                          <p className="truncate text-[10px] text-neutral-400">{event.email || "—"}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ${style.badge}`}>
                          {formatEvent(event.event_type)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-xl bg-neutral-50 p-3">
                          <p className="uppercase tracking-[0.1em] text-neutral-400">Fecha</p>
                          <p className="mt-1 font-medium text-neutral-700">{formatDate(event.created_at)}</p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3">
                          <p className="uppercase tracking-[0.1em] text-neutral-400">Equipo</p>
                          <p className="mt-1 font-medium text-neutral-700">{event.device_type || "—"}</p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3">
                          <p className="uppercase tracking-[0.1em] text-neutral-400">Navegador</p>
                          <p className="mt-1 font-medium text-neutral-700">{event.browser || "—"} · {event.operating_system || "—"}</p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3">
                          <p className="uppercase tracking-[0.1em] text-neutral-400">IP</p>
                          <p className="mt-1 break-all font-mono text-neutral-700">{event.ip_address || "—"}</p>
                        </div>
                      </div>

                      {event.failure_reason ? (
                        <p className="rounded-xl bg-red-50 px-3 py-2 text-[10px] font-medium text-red-700">
                          {formatFailure(event.failure_reason)}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex flex-col gap-3 border-t border-neutral-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-neutral-400">
              Página {Number(pagination.page || 1)} de {Math.max(1, Number(pagination.total_pages || 1))}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadHistory(Math.max(1, Number(pagination.page || 1) - 1))}
                disabled={loading || Number(pagination.page || 1) <= 1}
                className="h-9 rounded-xl border border-neutral-200 px-4 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => loadHistory(Number(pagination.page || 1) + 1)}
                disabled={loading || Number(pagination.page || 1) >= Number(pagination.total_pages || 1)}
                className="h-9 rounded-xl border border-neutral-200 px-4 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
