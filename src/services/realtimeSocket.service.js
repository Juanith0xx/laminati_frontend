"use client";

import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const HEARTBEAT_INTERVAL_MS = 30000;

let socket = null;
let heartbeatTimer = null;

function getSocketUrl() {
  const raw = String(API_URL || "").trim();

  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);
    const pathname = url.pathname.replace(/\/+$/, "");

    if (pathname.endsWith("/api")) {
      url.pathname = pathname.slice(0, -4) || "/";
    }

    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return raw
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");
  }
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    window.clearInterval(heartbeatTimer);
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
      activeSocket.emit("presence:heartbeat");
    }
  };

  sendHeartbeat();

  heartbeatTimer = window.setInterval(
    sendHeartbeat,
    HEARTBEAT_INTERVAL_MS
  );
}

function createSocket() {
  if (typeof window === "undefined") {
    return null;
  }

  const socketUrl = getSocketUrl();

  if (!socketUrl) {
    return null;
  }

  const nextSocket = io(socketUrl, {
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  nextSocket.on("connect", () => {
    startHeartbeat(nextSocket);
  });

  nextSocket.on("disconnect", () => {
    stopHeartbeat();
  });

  nextSocket.on("connect_error", (error) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "No fue posible conectar realtime:",
        error?.message || error
      );
    }
  });

  return nextSocket;
}

export function getRealtimeSocket() {
  if (!socket) {
    socket = createSocket();
  }

  return socket;
}

export function connectRealtimeSocket() {
  const activeSocket = getRealtimeSocket();

  if (activeSocket && !activeSocket.connected) {
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
