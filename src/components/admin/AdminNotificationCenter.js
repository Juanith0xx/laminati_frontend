"use client";

import {
  useEffect,
  useMemo,
  useRef,
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

const PAGE_LIMIT =
  15;

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-[19px] w-[19px]"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M7 18.5 3.5 21v-5.2A8 8 0 1 1 7 18.5Z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M6 7h12l1 14H5L6 7Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function QuotationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}


function timeAgo(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const seconds =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          date.getTime()
        ) /
          1000
      )
    );

  if (
    seconds <
    60
  ) {
    return "Ahora";
  }

  const minutes =
    Math.floor(
      seconds /
        60
    );

  if (
    minutes <
    60
  ) {
    return `Hace ${minutes} min`;
  }

  const hours =
    Math.floor(
      minutes /
        60
    );

  if (
    hours <
    24
  ) {
    return `Hace ${hours} h`;
  }

  const days =
    Math.floor(
      hours /
        24
    );

  if (
    days ===
    1
  ) {
    return "Ayer";
  }

  if (
    days <
    7
  ) {
    return `Hace ${days} días`;
  }

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "2-digit",

      timeZone:
        "America/Santiago",
    }
  ).format(
    date
  );
}

function NotificationIcon({
  type,
}) {
  const isOrder =
    type ===
    "ORDER_NEW";

  const isQuotation =
    type ===
    "QUOTATION_VIEWED";

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
        isOrder
          ? "bg-violet-50 text-violet-700"
          : isQuotation
            ? "bg-sky-50 text-sky-700"
            : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {isOrder
        ? <OrderIcon />
        : isQuotation
          ? <QuotationIcon />
          : <ContactIcon />}
    </span>
  );
}

export default function AdminNotificationCenter() {
  const router =
    useRouter();

  const containerRef =
    useRef(null);

  const [
    open,
    setOpen,
  ] =
    useState(false);

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
    notifications,
    setNotifications,
  ] =
    useState([]);

  const [
    unreadCount,
    setUnreadCount,
  ] =
    useState(0);

  const unreadLabel =
    unreadCount >
    99
      ? "99+"
      : String(
          unreadCount
        );

  const visibleNotifications =
    useMemo(
      () =>
        notifications.slice(
          0,
          PAGE_LIMIT
        ),
      [
        notifications,
      ]
    );

  const loadNotifications =
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
              1,

            limit:
              PAGE_LIMIT,

            signal,
          });

        setNotifications(
          Array.isArray(
            response
              ?.notifications
          )
            ? response
                .notifications
            : []
        );

        setUnreadCount(
          Number(
            response
              ?.unread_count ||
              0
          )
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
    };

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadNotifications(
        controller.signal
      );

      return () => {
        controller.abort();
      };
    },
    []
  );

  useEffect(
    () => {
      const handleReceived =
        (
          event
        ) => {
          const notification =
            event
              ?.detail;

          if (
            !notification?.id
          ) {
            return;
          }

          setNotifications(
            (
              current
            ) => {
              const existing =
                current.find(
                  (
                    item
                  ) =>
                    item.id ===
                    notification.id
                );

              if (
                existing
              ) {
                return current;
              }

              return [
                {
                  ...notification,
                  is_read:
                    false,
                  read_at:
                    null,
                },
                ...current,
              ].slice(
                0,
                PAGE_LIMIT
              );
            }
          );

          setUnreadCount(
            (
              current
            ) =>
              current +
              1
          );
        };

      const handleRead =
        (
          event
        ) => {
          const notificationId =
            event
              ?.detail
              ?.notification_id;

          if (
            !notificationId
          ) {
            return;
          }

          let wasUnread =
            false;

          setNotifications(
            (
              current
            ) =>
              current.map(
                (
                  item
                ) => {
                  if (
                    item.id !==
                    notificationId
                  ) {
                    return item;
                  }

                  if (
                    !item.is_read
                  ) {
                    wasUnread =
                      true;
                  }

                  return {
                    ...item,

                    is_read:
                      true,

                    read_at:
                      item.read_at ||
                      new Date()
                        .toISOString(),
                  };
                }
              )
          );

          if (
            wasUnread
          ) {
            setUnreadCount(
              (
                current
              ) =>
                Math.max(
                  0,
                  current -
                    1
                )
            );
          }
        };

      const handleReadAll =
        () => {
          setNotifications(
            (
              current
            ) =>
              current.map(
                (
                  item
                ) => ({
                  ...item,

                  is_read:
                    true,

                  read_at:
                    item.read_at ||
                    new Date()
                      .toISOString(),
                })
              )
          );

          setUnreadCount(
            0
          );
        };

      window.addEventListener(
        ADMIN_NOTIFICATION_RECEIVED_EVENT,
        handleReceived
      );

      window.addEventListener(
        ADMIN_NOTIFICATION_READ_EVENT,
        handleRead
      );

      window.addEventListener(
        ADMIN_NOTIFICATIONS_READ_ALL_EVENT,
        handleReadAll
      );

      return () => {
        window.removeEventListener(
          ADMIN_NOTIFICATION_RECEIVED_EVENT,
          handleReceived
        );

        window.removeEventListener(
          ADMIN_NOTIFICATION_READ_EVENT,
          handleRead
        );

        window.removeEventListener(
          ADMIN_NOTIFICATIONS_READ_ALL_EVENT,
          handleReadAll
        );
      };
    },
    []
  );

  useEffect(
    () => {
      if (
        !open
      ) {
        return undefined;
      }

      const handlePointerDown =
        (
          event
        ) => {
          if (
            containerRef
              .current &&
            !containerRef
              .current
              .contains(
                event.target
              )
          ) {
            setOpen(
              false
            );
          }
        };

      const handleKeyDown =
        (
          event
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setOpen(
              false
            );
          }
        };

      document.addEventListener(
        "pointerdown",
        handlePointerDown
      );

      window.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        document.removeEventListener(
          "pointerdown",
          handlePointerDown
        );

        window.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    [
      open,
    ]
  );

  const markAsRead =
    async (
      notification
    ) => {
      if (
        notification
          .is_read
      ) {
        return;
      }

      setNotifications(
        (
          current
        ) =>
          current.map(
            (
              item
            ) =>
              item.id ===
              notification.id
                ? {
                    ...item,

                    is_read:
                      true,

                    read_at:
                      new Date()
                        .toISOString(),
                  }
                : item
          )
      );

      setUnreadCount(
        (
          current
        ) =>
          Math.max(
            0,
            current - 1
          )
      );

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
      } catch {
        await loadNotifications();
      }
    };

  const openNotification =
    async (
      notification
    ) => {
      await markAsRead(
        notification
      );

      setOpen(
        false
      );

      if (
        notification
          .href
      ) {
        router.push(
          notification.href
        );
      }
    };

  const handleReadAll =
    async () => {
      if (
        unreadCount ===
          0 ||
        actionBusy
      ) {
        return;
      }

      try {
        setActionBusy(
          true
        );

        setNotifications(
          (
            current
          ) =>
            current.map(
              (
                item
              ) => ({
                ...item,

                is_read:
                  true,

                read_at:
                  item.read_at ||
                  new Date()
                    .toISOString(),
              })
            )
        );

        setUnreadCount(
          0
        );

        await markAllAdminNotificationsRead();

        window.dispatchEvent(
          new CustomEvent(
            ADMIN_NOTIFICATIONS_READ_ALL_EVENT
          )
        );
      } catch (
        requestError
      ) {
        setError(
          requestError
            ?.message ||
            "No fue posible marcar las notificaciones."
        );

        await loadNotifications();
      } finally {
        setActionBusy(
          false
        );
      }
    };

  return (
    <div
      ref={
        containerRef
      }
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        aria-label={
          unreadCount >
          0
            ? `Notificaciones, ${unreadCount} sin leer`
            : "Notificaciones"
        }
        aria-expanded={
          open
        }
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition ${
          open
            ? "border-black bg-black text-white"
            : "border-black/10 text-black hover:bg-neutral-100"
        }`}
      >
        <BellIcon />

        {unreadCount >
          0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
            {
              unreadLabel
            }
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-4 right-4 top-[78px] z-[210] overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_24px_80px_rgba(0,0,0,.18)] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[390px]">
          <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-5 py-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Laminati · Backoffice
              </p>

              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-base font-semibold text-neutral-950">
                  Notificaciones
                </h2>

                {unreadCount >
                  0 && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    {
                      unreadCount
                    }{" "}
                    nuevas
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={
                handleReadAll
              }
              disabled={
                unreadCount ===
                  0 ||
                actionBusy
              }
              className="text-[11px] font-semibold text-neutral-500 transition hover:text-black disabled:cursor-default disabled:opacity-40"
            >
              Marcar leídas
            </button>
          </div>

          <div className="max-h-[min(520px,calc(100vh-160px))] overflow-y-auto">
            {loading && (
              <div className="px-5 py-10 text-center text-sm text-neutral-400">
                Cargando
                notificaciones...
              </div>
            )}

            {!loading &&
              error && (
                <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">
                    {
                      error
                    }
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      loadNotifications()
                    }
                    className="mt-2 text-xs font-semibold text-red-700 underline"
                  >
                    Reintentar
                  </button>
                </div>
              )}

            {!loading &&
              !error &&
              visibleNotifications
                .length ===
                0 && (
                <div className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                    <BellIcon />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-neutral-800">
                    Sin notificaciones
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    Los nuevos contactos y pedidos aparecerán aquí.
                  </p>
                </div>
              )}

            {!loading &&
              visibleNotifications
                .length >
                0 && (
                <div className="divide-y divide-neutral-100">
                  {visibleNotifications.map(
                    (
                      notification
                    ) => (
                      <button
                        key={
                          notification.id
                        }
                        type="button"
                        onClick={() =>
                          openNotification(
                            notification
                          )
                        }
                        className={`relative flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-neutral-50 ${
                          notification.is_read
                            ? "bg-white"
                            : "bg-[#fbfbff]"
                        }`}
                      >
                        {!notification
                          .is_read && (
                          <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-violet-500" />
                        )}

                        <NotificationIcon
                          type={
                            notification.type
                          }
                        />

                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span
                              className={`block truncate text-sm ${
                                notification.is_read
                                  ? "font-medium text-neutral-700"
                                  : "font-semibold text-neutral-950"
                              }`}
                            >
                              {
                                notification.title
                              }
                            </span>

                            <span className="shrink-0 text-[10px] text-neutral-400">
                              {timeAgo(
                                notification.created_at
                              )}
                            </span>
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-neutral-500">
                            {
                              notification.message
                            }
                          </span>
                        </span>
                      </button>
                    )
                  )}
                </div>
              )}
          </div>

          <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-3">
            <p className="text-center text-[10px] leading-4 text-neutral-400">
              Las notificaciones se guardan en Laminatiword y no se pierden al recargar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
