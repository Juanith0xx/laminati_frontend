"use client";

import { io } from "socket.io-client";

import {
  apiRequest,
} from "@/services/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

const REALTIME_URL =
  process.env.NEXT_PUBLIC_REALTIME_URL;

const HEARTBEAT_INTERVAL_MS = 30000;

let socket = null;
let heartbeatTimer = null;

function normalizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "");
}

function getSocketUrl() {
  const explicitRealtimeUrl =
    normalizeBaseUrl(
      REALTIME_URL
    );

  if (explicitRealtimeUrl) {
    return explicitRealtimeUrl;
  }

  const rawApiUrl =
    normalizeBaseUrl(
      API_URL
    );

  /*
   * Si NEXT_PUBLIC_API_URL ya es absoluta podemos
   * reutilizar su host eliminando /api.
   */
  if (/^https?:\/\//i.test(rawApiUrl)) {
    try {
      const url = new URL(rawApiUrl);
      const pathname =
        url.pathname.replace(
          /\/+$/,
          ""
        );

      if (pathname.endsWith("/api")) {
        url.pathname =
          pathname.slice(0, -4) ||
          "/";
      }

      url.search = "";
      url.hash = "";

      return url
        .toString()
        .replace(/\/$/, "");
    } catch {
      return rawApiUrl
        .replace(/\/api\/?$/, "")
        .replace(/\/$/, "");
    }
  }

  /*
   * En local NEXT_PUBLIC_API_URL puede ser /api.
   * Socket.IO vive directamente en :5000.
   */
  if (
    typeof window !== "undefined" &&
    [
      "localhost",
      "127.0.0.1",
    ].includes(
      window.location.hostname
    )
  ) {
    return "http://localhost:5000";
  }

  /*
   * En producción, si la API usa /api mediante
   * rewrite de Vercel, el origen realtime debe
   * configurarse explícitamente con:
   * NEXT_PUBLIC_REALTIME_URL.
   */
  return "";
}

async function getRealtimeAuthPayload() {
  try {
    const response =
      await apiRequest(
        "/auth/realtime-token",
        {
          method: "POST",
        }
      );

    const token = String(
      response?.realtime_token ||
        ""
    ).trim();

    if (!token) {
      return {};
    }

    return {
      token,
    };
  } catch (error) {
    console.warn(
      "No fue posible obtener credencial realtime:",
      error?.message || error
    );

    return {};
  }
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    window.clearInterval(
      heartbeatTimer
    );
    heartbeatTimer = null;
  }
}

function startHeartbeat(activeSocket) {
  stopHeartbeat();

  if (typeof window === "undefined") {
    return;
  }

  const sendHeartbeat = () => {
    if (activeSocket?.connected) {
      activeSocket.emit(
        "presence:heartbeat"
      );
    }
  };

  sendHeartbeat();

  heartbeatTimer =
    window.setInterval(
      sendHeartbeat,
      HEARTBEAT_INTERVAL_MS
    );
}

function createSocket() {
  if (typeof window === "undefined") {
    return null;
  }

  const socketUrl =
    getSocketUrl();

  if (!socketUrl) {
    console.warn(
      "Realtime no configurado: define NEXT_PUBLIC_REALTIME_URL en producción."
    );
    return null;
  }

  const nextSocket = io(
    socketUrl,
    {
      autoConnect: false,
      withCredentials: true,
      transports: [
        "websocket",
        "polling",
      ],
      reconnection: true,
      reconnectionAttempts:
        Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,

      /*
       * Socket.IO ejecuta esta función en cada
       * conexión/reconexión. Así el token efímero
       * siempre se renueva mediante la cookie HttpOnly
       * del dominio Vercel antes de conectar a Railway.
       */
      auth: async (callback) => {
        const authPayload =
          await getRealtimeAuthPayload();

        callback(
          authPayload
        );
      },
    }
  );

  nextSocket.on(
    "connect",
    () => {
      startHeartbeat(
        nextSocket
      );
    }
  );

  nextSocket.on(
    "disconnect",
    () => {
      stopHeartbeat();
    }
  );

  nextSocket.on(
    "connect_error",
    (error) => {
      /*
       * Se deja visible también en producción mientras
       * estabilizamos presencia. No expone el token.
       */
      console.warn(
        "No fue posible conectar realtime:",
        error?.message || error
      );
    }
  );

  return nextSocket;
}

export function getRealtimeSocket() {
  if (!socket) {
    socket = createSocket();
  }

  return socket;
}

export function connectRealtimeSocket() {
  const activeSocket =
    getRealtimeSocket();

  if (
    activeSocket &&
    !activeSocket.connected
  ) {
    activeSocket.connect();
  }

  return activeSocket;
}

export function disconnectRealtimeSocket() {
  stopHeartbeat();

  if (socket?.connected) {
    socket.disconnect();
  }
}
