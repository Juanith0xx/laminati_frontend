"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ADMIN_NOTIFICATION_READ_EVENT,
  ADMIN_NOTIFICATION_RECEIVED_EVENT,
  ADMIN_NOTIFICATIONS_READ_ALL_EVENT,
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/services/adminNotifications.service";

const EMPTY_FILTERS = {
  search: "",
  type: "ALL",
  readStatus: "ALL",
  page: 1,
  limit: 20,
};

const TYPE_OPTIONS = [
  {
    value: "ALL",
    label: "Todos los tipos",
  },
  {
    value: "CONTACT_NEW",
    label: "Contactos",
  },
  {
    value: "ORDER_NEW",
    label: "Pedidos online",
  },
];

const STATUS_OPTIONS = [
  {
    value: "ALL",
    label: "Todas",
  },
  {
    value: "UNREAD",
    label: "No leídas",
  },
  {
    value: "READ",
    label: "Leídas",
  },
];

function BellIcon({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </svg>
  );
}

function ContactIcon({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 18.5 3.5 21v-5.2A8 8 0 1 1 7 18.5Z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

function OrderIcon({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 7h12l1 14H5L6 7Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function ArrowIcon({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",

      timeZone:
        "America/Santiago",
    }
  ).format(
    date
  );
}

function TypeBadge({
  type,
}) {
  const isOrder =
    type ===
    "ORDER_NEW";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
        isOrder
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {isOrder
        ? (
          <OrderIcon className="h-3.5 w-3.5" />
        )
        : (
          <ContactIcon className="h-3.5 w-3.5" />
        )}

      {isOrder
        ? "Pedido online"
        : "Contacto"}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  description,
}) {
  return (
    <article className="rounded-[24px] border border-black/[0.05] bg-white p-5 shadow-sm">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
        {Number(
          value || 0
        ).toLocaleString(
          "es-CL"
        )}
      </p>

      <p className="mt-1 text-xs text-neutral-400">
        {description}
      </p>
    </article>
  );
}

export default function AdminNotificationsPage() {
  const router =
    useRouter();

  const [
    form,
    setForm,
  ] =
    useState(
      EMPTY_FILTERS
    );

  const [
    applied,
    setApplied,
  ] =
    useState(
      EMPTY_FILTERS
    );

  const [
    result,
    setResult,
  ] =
    useState(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    actionBusy,
    setActionBusy,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(0);

  const loadData =
    useCallback(
      async (
        signal
      ) => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const response =
            await listAdminNotifications({
              page:
                applied.page,

              limit:
                applied.limit,

              search:
                applied.search,

              type:
                applied.type,

              readStatus:
                applied.readStatus,

              signal,
            });

          setResult(
            response
          );
        } catch (
          requestError
        ) {
          if (
            requestError
              ?.name ===
            "AbortError"
          ) {
            return;
          }

          setError(
            requestError
              ?.message ||
              "No fue posible cargar las notificaciones."
          );
        } finally {
          if (
            !signal
              ?.aborted
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        applied,
      ]
    );

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadData(
        controller.signal
      );

      return () => {
        controller.abort();
      };
    },
    [
      loadData,
      refreshKey,
    ]
  );

  useEffect(
    () => {
      const handleRealtime =
        () => {
          setRefreshKey(
            (current) =>
              current +
              1
          );
        };

      window.addEventListener(
        ADMIN_NOTIFICATION_RECEIVED_EVENT,
        handleRealtime
      );

      window.addEventListener(
        ADMIN_NOTIFICATION_READ_EVENT,
        handleRealtime
      );

      window.addEventListener(
        ADMIN_NOTIFICATIONS_READ_ALL_EVENT,
        handleRealtime
      );

      return () => {
        window.removeEventListener(
          ADMIN_NOTIFICATION_RECEIVED_EVENT,
          handleRealtime
        );

        window.removeEventListener(
          ADMIN_NOTIFICATION_READ_EVENT,
          handleRealtime
        );

        window.removeEventListener(
          ADMIN_NOTIFICATIONS_READ_ALL_EVENT,
          handleRealtime
        );
      };
    },
    []
  );

  const notifications =
    Array.isArray(
      result
        ?.notifications
    )
      ? result.notifications
      : [];

  const summary =
    result?.summary ||
    {
      total_count: 0,
      unread_count: 0,
      read_count: 0,
    };

  const pagination =
    result?.pagination ||
    {
      page: 1,
      total: 0,
      total_pages: 0,
      has_next_page: false,
      has_previous_page: false,
    };

  const filteredLabel =
    useMemo(
      () => {
        if (
          loading
        ) {
          return "Consultando...";
        }

        return `${Number(
          pagination.total ||
            0
        ).toLocaleString(
          "es-CL"
        )} resultados`;
      },
      [
        loading,
        pagination.total,
      ]
    );

  const setField =
    (
      field,
      value
    ) => {
      setForm(
        (current) => ({
          ...current,
          [field]:
            value,
        })
      );
    };

  const applyFilters =
    (
      event
    ) => {
      event.preventDefault();

      setApplied({
        ...form,
        page:
          1,
      });
    };

  const clearFilters =
    () => {
      setForm({
        ...EMPTY_FILTERS,
      });

      setApplied({
        ...EMPTY_FILTERS,
      });

      setError(
        ""
      );
    };

  const openNotification =
    async (
      notification
    ) => {
      if (
        !notification
          .is_read
      ) {
        try {
          await markAdminNotificationRead(
            notification.id
          );

          window.dispatchEvent(
            new CustomEvent(
              ADMIN_NOTIFICATION_READ_EVENT,
              {
                detail: {
                  notification_id:
                    notification.id,
                },
              }
            )
          );
        } catch (
          requestError
        ) {
          setError(
            requestError
              ?.message ||
              "No fue posible marcar la notificación como leída."
          );

          return;
        }
      }

      if (
        notification
          .href
      ) {
        router.push(
          notification.href
        );
      }
    };

  const handleMarkAll =
    async () => {
      if (
        actionBusy ||
        Number(
          summary.unread_count ||
            0
        ) ===
          0
      ) {
        return;
      }

      try {
        setActionBusy(
          true
        );

        setError(
          ""
        );

        await markAllAdminNotificationsRead();

        window.dispatchEvent(
          new CustomEvent(
            ADMIN_NOTIFICATIONS_READ_ALL_EVENT
          )
        );

        setRefreshKey(
          (current) =>
            current +
            1
        );
      } catch (
        requestError
      ) {
        setError(
          requestError
            ?.message ||
            "No fue posible marcar todas las notificaciones."
        );
      } finally {
        setActionBusy(
          false
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f7f6f4] px-4 py-7 text-neutral-950 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-white px-6 py-7 shadow-sm sm:px-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#e45e59] via-[#c56b9e] to-[#6953af]" />

          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-neutral-400">
                LAMINATI · BACKOFFICE
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Notificaciones
              </h1>

              <p className="mt-1 text-sm text-neutral-500">
                Historial de contactos y pedidos online recibidos por Laminatiword.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setRefreshKey(
                    (current) =>
                      current +
                      1
                  )
                }
                disabled={
                  loading
                }
                className="h-11 rounded-full border border-neutral-200 bg-white px-5 text-sm font-medium transition hover:bg-neutral-50 disabled:opacity-50"
              >
                Actualizar
              </button>

              <button
                type="button"
                onClick={
                  handleMarkAll
                }
                disabled={
                  actionBusy ||
                  Number(
                    summary.unread_count ||
                      0
                  ) ===
                    0
                }
                className="h-11 rounded-full bg-black px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {actionBusy
                  ? "Actualizando..."
                  : "Marcar todas como leídas"}
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Notificaciones"
            value={
              summary.total_count
            }
            description="Historial registrado"
          />

          <SummaryCard
            label="No leídas"
            value={
              summary.unread_count
            }
            description="Pendientes de revisión"
          />

          <SummaryCard
            label="Leídas"
            value={
              summary.read_count
            }
            description="Ya revisadas"
          />
        </section>

        <form
          onSubmit={
            applyFilters
          }
          className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.5fr_0.8fr_0.8fr_auto]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">
                Buscar
              </span>

              <input
                value={
                  form.search
                }
                onChange={(
                  event
                ) =>
                  setField(
                    "search",
                    event.target
                      .value
                  )
                }
                maxLength={
                  120
                }
                placeholder="Título, mensaje o número de pedido..."
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition placeholder:text-neutral-300 focus:border-black"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">
                Tipo
              </span>

              <select
                value={
                  form.type
                }
                onChange={(
                  event
                ) =>
                  setField(
                    "type",
                    event.target
                      .value
                  )
                }
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
              >
                {TYPE_OPTIONS.map(
                  (
                    option
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600">
                Estado
              </span>

              <select
                value={
                  form.readStatus
                }
                onChange={(
                  event
                ) =>
                  setField(
                    "readStatus",
                    event.target
                      .value
                  )
                }
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none transition focus:border-black"
              >
                {STATUS_OPTIONS.map(
                  (
                    option
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="h-11 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Filtrar
              </button>

              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="h-11 rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
              >
                Limpiar
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-5 sm:px-7">
            <div>
              <h2 className="text-lg font-semibold">
                Historial
              </h2>

              <p className="mt-1 text-xs text-neutral-400">
                Las notificaciones permanecen guardadas después de recargar o cerrar sesión.
              </p>
            </div>

            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
              {
                filteredLabel
              }
            </span>
          </div>

          {loading && (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                <BellIcon className="h-5 w-5" />
              </div>

              <p className="mt-3 text-sm text-neutral-500">
                Cargando notificaciones...
              </p>
            </div>
          )}

          {!loading &&
            notifications.length ===
              0 && (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                  <BellIcon className="h-5 w-5" />
                </div>

                <p className="mt-3 text-sm font-semibold text-neutral-800">
                  No hay notificaciones para estos filtros
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  Los nuevos contactos y pedidos online aparecerán automáticamente.
                </p>
              </div>
            )}

          {!loading &&
            notifications.length >
              0 && (
              <>
                <div className="divide-y divide-neutral-100">
                  {notifications.map(
                    (
                      notification
                    ) => (
                      <article
                        key={
                          notification.id
                        }
                        className={`relative px-5 py-5 transition sm:px-7 ${
                          notification.is_read
                            ? "bg-white"
                            : "bg-[#fbfbff]"
                        }`}
                      >
                        {!notification
                          .is_read && (
                          <span className="absolute bottom-5 left-2 top-5 w-1 rounded-full bg-violet-500" />
                        )}

                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                              notification.type ===
                              "ORDER_NEW"
                                ? "bg-violet-50 text-violet-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {notification.type ===
                            "ORDER_NEW"
                              ? (
                                <OrderIcon className="h-5 w-5" />
                              )
                              : (
                                <ContactIcon className="h-5 w-5" />
                              )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={`text-sm ${
                                  notification.is_read
                                    ? "font-medium text-neutral-800"
                                    : "font-semibold text-neutral-950"
                                }`}
                              >
                                {
                                  notification.title
                                }
                              </p>

                              <TypeBadge
                                type={
                                  notification.type
                                }
                              />

                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                  notification.is_read
                                    ? "bg-neutral-100 text-neutral-500"
                                    : "bg-violet-50 text-violet-700"
                                }`}
                              >
                                {notification.is_read
                                  ? "Leída"
                                  : "No leída"}
                              </span>
                            </div>

                            <p className="mt-1.5 text-sm text-neutral-600">
                              {
                                notification.message
                              }
                            </p>

                            <p className="mt-2 text-xs text-neutral-400">
                              {formatDate(
                                notification.created_at
                              )}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openNotification(
                                notification
                              )
                            }
                            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-semibold text-neutral-700 transition hover:border-black hover:bg-black hover:text-white"
                          >
                            {notification.type ===
                            "ORDER_NEW"
                              ? "Ver pedido"
                              : "Ver consulta"}

                            <ArrowIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </article>
                    )
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-5 py-4 sm:px-7">
                  <span className="text-xs text-neutral-500">
                    Página{" "}
                    {
                      pagination.page
                    }{" "}
                    de{" "}
                    {Math.max(
                      1,
                      pagination.total_pages ||
                        1
                    )}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={
                        !pagination.has_previous_page
                      }
                      onClick={() =>
                        setApplied(
                          (
                            current
                          ) => ({
                            ...current,
                            page:
                              Math.max(
                                1,
                                current.page -
                                  1
                              ),
                          })
                        )
                      }
                      className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-medium transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Anterior
                    </button>

                    <button
                      type="button"
                      disabled={
                        !pagination.has_next_page
                      }
                      onClick={() =>
                        setApplied(
                          (
                            current
                          ) => ({
                            ...current,
                            page:
                              current.page +
                              1,
                          })
                        )
                      }
                      className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-medium transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </>
            )}
        </section>
      </div>
    </main>
  );
}
