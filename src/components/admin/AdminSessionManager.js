"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/services/api";
import {
  clearAuthSession,
} from "@/services/auth.service";

const WARNING_TIME_MS = 5 * 60 * 1000;
const FORCE_MODAL_TIME_MS = 15 * 1000;
const DISMISS_TIME_MS = 10 * 1000;
const SESSION_SYNC_INTERVAL_MS = 60 * 1000;

const formatRemainingTime = (remainingMs) => {
  const safeSeconds = Math.max(
    Math.ceil(remainingMs / 1000),
    0
  );

  const minutes = Math.floor(
    safeSeconds / 60
  );
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

export default function AdminSessionManager() {
  const router = useRouter();

  const [expiresAt, setExpiresAt] =
    useState(null);
  const [clockOffsetMs, setClockOffsetMs] =
    useState(0);
  const [remainingMs, setRemainingMs] =
    useState(null);
  const [showModal, setShowModal] =
    useState(false);
  const [extending, setExtending] =
    useState(false);
  const [extensionError, setExtensionError] =
    useState("");
  const [renewalDurationLabel, setRenewalDurationLabel] =
    useState("2 horas");

  const logoutStartedRef = useRef(false);
  const dismissedUntilRef = useRef(0);

  const getServerNow = useCallback(
    () => Date.now() + clockOffsetMs,
    [clockOffsetMs]
  );

  const finishSession = useCallback(
    (reason = "session-expired") => {
      if (logoutStartedRef.current) {
        return;
      }

      logoutStartedRef.current = true;
      clearAuthSession();

      router.replace(
        `/login?reason=${encodeURIComponent(
          reason
        )}`
      );
      router.refresh();
    },
    [router]
  );

  const applySessionMetadata = useCallback(
    (response) => {
      const nextExpiresAt = Number(
        response?.expires_at || 0
      );
      const serverTime = Number(
        response?.server_time || Date.now()
      );

      if (!nextExpiresAt) {
        return false;
      }

      const nextClockOffset =
        serverTime - Date.now();
      const nextRemaining = Math.max(
        nextExpiresAt - serverTime,
        0
      );

      setClockOffsetMs(nextClockOffset);
      setExpiresAt(nextExpiresAt);
      setRemainingMs(nextRemaining);

      if (
        response?.renewal_duration_label
      ) {
        setRenewalDurationLabel(
          response.renewal_duration_label
        );
      }

      if (nextRemaining > WARNING_TIME_MS) {
        dismissedUntilRef.current = 0;
        setShowModal(false);
        setExtensionError("");
      }

      return true;
    },
    []
  );

  const syncSession = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const response = await apiRequest(
          "/auth/session"
        );

        if (
          !response?.authenticated ||
          !applySessionMetadata(response)
        ) {
          finishSession(
            "session-invalid"
          );
        }
      } catch (error) {
        if (
          error?.status === 401 ||
          error?.status === 403
        ) {
          finishSession(
            "session-expired"
          );
          return;
        }

        if (!silent) {
          console.error(
            "No fue posible sincronizar la sesión:",
            error
          );
        }
      }
    },
    [
      applySessionMetadata,
      finishSession,
    ]
  );

  const handleExtendSession =
    useCallback(async () => {
      if (extending) {
        return;
      }

      try {
        setExtending(true);
        setExtensionError("");

        const response = await apiRequest(
          "/auth/extend-session",
          {
            method: "POST",
          }
        );

        if (!applySessionMetadata(response)) {
          throw new Error(
            "El servidor no devolvió una nueva expiración"
          );
        }

        dismissedUntilRef.current = 0;
        setShowModal(false);
      } catch (error) {
        if (
          error?.status === 401 ||
          error?.status === 403
        ) {
          finishSession(
            "session-expired"
          );
          return;
        }

        setExtensionError(
          error?.message ||
            "No fue posible extender la sesión. Inténtalo nuevamente."
        );
      } finally {
        setExtending(false);
      }
    },
    [
      applySessionMetadata,
      extending,
      finishSession,
    ]
  );

  const handleLogout = useCallback(() => {
    finishSession("logout");
  }, [finishSession]);

  const handleTemporaryDismiss = useCallback(
    () => {
      if (
        remainingMs !== null &&
        remainingMs <= FORCE_MODAL_TIME_MS
      ) {
        return;
      }

      dismissedUntilRef.current =
        Date.now() + DISMISS_TIME_MS;
      setShowModal(false);
    },
    [remainingMs]
  );

  useEffect(() => {
    void syncSession();

    const syncInterval = window.setInterval(
      () => {
        void syncSession({
          silent: true,
        });
      },
      SESSION_SYNC_INTERVAL_MS
    );

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void syncSession({
          silent: true,
        });
      }
    };

    const handleFocus = () => {
      void syncSession({
        silent: true,
      });
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.clearInterval(syncInterval);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [syncSession]);

  useEffect(() => {
    if (!expiresAt) {
      return undefined;
    }

    const tick = () => {
      const nextRemaining = Math.max(
        expiresAt - getServerNow(),
        0
      );

      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0) {
        setShowModal(false);
        finishSession(
          "session-expired"
        );
        return;
      }

      if (
        nextRemaining <= WARNING_TIME_MS
      ) {
        const dismissed =
          Date.now() <
          dismissedUntilRef.current;

        const mustForceOpen =
          nextRemaining <=
          FORCE_MODAL_TIME_MS;

        setShowModal(
          mustForceOpen || !dismissed
        );
      } else {
        setShowModal(false);
      }
    };

    tick();

    const timer = window.setInterval(
      tick,
      1000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [
    expiresAt,
    finishSession,
    getServerNow,
  ]);

  useEffect(() => {
    if (!showModal) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [showModal]);

  if (
    !showModal ||
    remainingMs === null
  ) {
    return null;
  }

  const canDismiss =
    remainingMs > FORCE_MODAL_TIME_MS;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-[2px]"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-session-title"
        aria-describedby="admin-session-description"
        className="relative w-full max-w-[500px] rounded-[30px] border border-black/5 bg-[#fffdfa] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.24)] sm:p-8"
      >
        {canDismiss && (
          <button
            type="button"
            onClick={
              handleTemporaryDismiss
            }
            disabled={extending}
            aria-label="Cerrar aviso temporalmente"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition hover:bg-black/5 hover:text-black disabled:opacity-40"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3eee6] text-[#79634d]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="h-8 w-8"
          >
            <circle
              cx="12"
              cy="12"
              r="8.25"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M12 7.75v4.75l3.1 1.8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">
            Seguridad del backoffice
          </p>

          <h2
            id="admin-session-title"
            className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-neutral-950 sm:text-[28px]"
          >
            ¿Quieres seguir conectado?
          </h2>

          <p
            id="admin-session-description"
            className="mx-auto mt-4 max-w-[390px] text-sm leading-6 text-neutral-600"
          >
            Tu sesión del backoffice está por expirar por seguridad. Si deseas continuar trabajando, confirma para extender tu sesión por{" "}
            <strong className="font-semibold text-neutral-800">
              {renewalDurationLabel}
            </strong>{" "}
            más.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-[#e9dfd2] bg-[#f7f2eb] px-4 py-3 text-center text-sm text-[#6f5b46]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
          >
            <circle
              cx="12"
              cy="12"
              r="8.25"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M12 7.75v4.75l3.1 1.8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          <span>
            La sesión expirará automáticamente en{" "}
            <strong className="font-semibold text-neutral-950 tabular-nums">
              {formatRemainingTime(
                remainingMs
              )}
            </strong>
          </span>
        </div>

        {extensionError && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm leading-5 text-red-700"
          >
            {extensionError}
          </div>
        )}

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={
              handleExtendSession
            }
            disabled={extending}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {extending
              ? "Extendiendo sesión..."
              : "Seguir conectado"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={extending}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cerrar sesión
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] leading-5 text-neutral-400">
          Si no realizas ninguna acción, cerraremos la sesión automáticamente para proteger el acceso administrativo.
        </p>
      </section>
    </div>
  );
}
