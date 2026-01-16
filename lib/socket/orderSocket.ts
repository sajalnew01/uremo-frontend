"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let socketInit = false;

function getSocketUrl() {
  return (
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://uremo-backend.onrender.com"
  );
}

/**
 * Returns a singleton Socket.IO client instance for Order chat.
 *
 * Important: This does NOT automatically connect on import.
 * Callers should set `socket.auth` and then call `socket.connect()`.
 */
export function getOrderSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("getOrderSocket() must be called in the browser");
  }

  if (!socketInit) {
    socketInit = true;

    const url = getSocketUrl();

    socket = io(url, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on("connect", () => console.log("[OrderSocket] Connected", socket?.id));
    socket.on("disconnect", (r) => console.log("[OrderSocket] Disconnected:", r));
    socket.on("connect_error", (e: any) =>
      console.error("[OrderSocket] connect_error:", e?.message || e)
    );
  }

  return socket!;
}
