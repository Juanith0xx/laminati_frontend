"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  io,
} from "socket.io-client";

import {
  ADMIN_NOTIFICATION_READ_EVENT,
  ADMIN_NOTIFICATION_RECEIVED_EVENT,
  QUOTATION_TRACKING_UPDATED_EVENT,
  markAdminNotificationRead,
} from "@/services/adminNotifications.service";

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL;

const TOAST_DURATION_MS =
  7000;

const MAX_TOASTS =
  4;

function getStoredToken() {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const value =
    localStorage.getItem(
      "token"
    );

  if (
    !value ||
    value === "null" ||
    value ===
      "undefined"
  ) {
    return null;
  }

  return String(value)
    .replace(
      /^"|"$/g,
      ""
    )
    .replace(
      /^Bearer\s+/i,
      ""
    )
    .trim();
}

function getSocketUrl() {
  const raw =
    String(
      API_URL || ""
    ).trim();

  if (!raw) {
    return "";
  }

  try {
    const url =
      new URL(raw);

    const pathname =
      url.pathname
        .replace(
          /\/+$/,
          ""
        );

    if (
      pathname.endsWith(
        "/api"
      )
    ) {
      url.pathname =
        pathname.slice(
          0,
          -4
        ) || "/";
    }

    url.search =
      "";

    url.hash =
      "";

    return url
      .toString()
      .replace(
        /\/$/,
        ""
      );
  } catch {
    return raw
      .replace(
        /\/api\/?$/,
        ""
      )
      .replace(
        /\/$/,
        ""
      );
  }
}

function money(
  value,
  currency = "CLP"
) {
  try {
    return new Intl.NumberFormat(
      "es-CL",
      {
        style:
          "currency",

        currency:
          currency ||
          "CLP",

        maximumFractionDigits:
          0,
      }
    ).format(
      Number(value) || 0
    );
  } catch {
    return `$${Number(
      value
    ) || 0}`;
  }
}

function ContactIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
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
      className="h-5 w-5"
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
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}


function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function Toast({
  notification,
  onClose,
  onOpen,
}) {
  const isOrder =
    notification.type ===
    "ORDER_NEW";

  const isQuotation =
    notification.type ===
    "QUOTATION_VIEWED";

  const total =
    isOrder
      ? notification
          ?.data?.total
      : null;

  return (
    <article
      className="pointer-events-auto w-full overflow-hidden rounded-[22px] border border-black/[0.07] bg-white shadow-[0_18px_60px_rgba(0,0,0,.16)]"
      role="status"
    >
      <div
        className={`h-1 ${
          isOrder
            ? "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500"
            : isQuotation
              ? "bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500"
              : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
        }`}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
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
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                  Laminati · Backoffice
                </p>

                <h3 className="mt-1 text-sm font-semibold text-neutral-950">
                  {
                    notification.title
                  }
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  onClose
                }
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-black"
                aria-label="Cerrar notificación"
              >
                <CloseIcon />
              </button>
            </div>

            <p className="mt-2 text-sm leading-5 text-neutral-600">
              {
                notification.message
              }
            </p>

            {isOrder &&
              total !== null &&
              total !==
                undefined && (
                <p className="mt-2 text-base font-semibold tabular-nums text-neutral-950">
                  {money(
                    total,
                    notification
                      ?.data
                      ?.currency
                  )}
                </p>
              )}

            {notification.href && (
              <button
                type="button"
                onClick={
                  onOpen
                }
                className="mt-3 inline-flex h-9 items-center rounded-xl bg-black px-4 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                {isOrder
                  ? "Ver pedido"
                  : isQuotation
                    ? "Ver cotización"
                    : "Ver consulta"}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AdminRealtimeNotifications() {
  const router =
    useRouter();

  const [
    notifications,
    setNotifications,
  ] =
    useState([]);

  const timersRef =
    useRef(
      new Map()
    );

  useEffect(() => {
    const token =
      getStoredToken();

    const socketUrl =
      getSocketUrl();

    if (
      !token ||
      !socketUrl
    ) {
      return undefined;
    }

    const socket =
      io(
        socketUrl,
        {
          auth: {
            token,
          },

          withCredentials:
            true,

          transports: [
            "websocket",
            "polling",
          ],

          reconnection:
            true,

          reconnectionAttempts:
            Infinity,

          reconnectionDelay:
            1000,

          reconnectionDelayMax:
            5000,
        }
      );

    const removeToast = (
      notificationId
    ) => {
      setNotifications(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              notificationId
          )
      );

      const timer =
        timersRef.current.get(
          notificationId
        );

      if (timer) {
        window.clearTimeout(
          timer
        );

        timersRef.current.delete(
          notificationId
        );
      }
    };

    const handleNotification = (
      payload
    ) => {
      if (
        !payload?.id ||
        !payload?.title ||
        !payload?.message
      ) {
        return;
      }

      setNotifications(
        (current) => {
          const withoutDuplicate =
            current.filter(
              (item) =>
                item.id !==
                payload.id
            );

          return [
            payload,
            ...withoutDuplicate,
          ].slice(
            0,
            MAX_TOASTS
          );
        }
      );

      window.dispatchEvent(
        new CustomEvent(
          ADMIN_NOTIFICATION_RECEIVED_EVENT,
          {
            detail:
              payload,
          }
        )
      );

      const timer =
        window.setTimeout(
          () => {
            removeToast(
              payload.id
            );
          },
          TOAST_DURATION_MS
        );

      timersRef.current.set(
        payload.id,
        timer
      );
    };

    const handleQuotationTrackingUpdated =
      (
        payload
      ) => {
        if (
          !payload
            ?.quotation_id
        ) {
          return;
        }

        window.dispatchEvent(
          new CustomEvent(
            QUOTATION_TRACKING_UPDATED_EVENT,
            {
              detail:
                payload,
            }
          )
        );
      };

    socket.on(
      "admin:notification",
      handleNotification
    );

    socket.on(
      "quotation:tracking-updated",
      handleQuotationTrackingUpdated
    );

    return () => {
      socket.off(
        "admin:notification",
        handleNotification
      );

      socket.off(
        "quotation:tracking-updated",
        handleQuotationTrackingUpdated
      );

      socket.disconnect();

      for (
        const timer
        of timersRef.current.values()
      ) {
        window.clearTimeout(
          timer
        );
      }

      timersRef.current.clear();
    };
  }, []);

  const removeToast = (
    notificationId
  ) => {
    setNotifications(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            notificationId
        )
    );

    const timer =
      timersRef.current.get(
        notificationId
      );

    if (timer) {
      window.clearTimeout(
        timer
      );

      timersRef.current.delete(
        notificationId
      );
    }
  };

  const openNotification = async (
    notification
  ) => {
    if (
      !notification?.href
    ) {
      return;
    }

    removeToast(
      notification.id
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
      /*
       * El acceso al destino no debe bloquearse
       * si falla solamente la actualización
       * de lectura.
       */
    }

    router.push(
      notification.href
    );
  };

  if (
    notifications.length ===
    0
  ) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed right-4 top-[88px] z-[220] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:w-full"
      aria-live="polite"
      aria-atomic="false"
    >
      {notifications.map(
        (
          notification
        ) => (
          <Toast
            key={
              notification.id
            }
            notification={
              notification
            }
            onClose={() =>
              removeToast(
                notification.id
              )
            }
            onOpen={() =>
              openNotification(
                notification
              )
            }
          />
        )
      )}
    </div>
  );
}
