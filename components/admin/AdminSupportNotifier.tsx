"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { getOrderSocket } from "@/lib/socket/orderSocket";
import {
  incrementAdminSupportUnread,
  setAdminSupportUnreadFromServer,
} from "@/lib/supportUnread";
import { apiRequest } from "@/lib/api";

function shortOrder(orderId: string) {
  const id = String(orderId || "");
  if (id.length <= 8) return id;
  return id.slice(-8);
}

export default function AdminSupportNotifier() {
  const { ready, isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const initializedRef = useRef(false);

  // Hydrate unread snapshot once per session
  useEffect(() => {
    if (!ready || !isAuthenticated || user?.role !== "admin") return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      try {
        const data = await apiRequest(
          "/api/admin/messages/unread",
          "GET",
          null,
          true
        );
        setAdminSupportUnreadFromServer(data?.byOrder);
      } catch {
        // ignore hydrate errors
      }
    })();
  }, [ready, isAuthenticated, user?.role]);

  // Join admin room + listen for notifications
  useEffect(() => {
    if (!ready || !isAuthenticated || user?.role !== "admin") return;

    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("token")
        : null;
    if (!token) return;

    const socket = getOrderSocket();
    (socket as any).auth = { token };

    const tryConnect = () => {
      if (socket.connected) return;
      const active = Boolean((socket as any)?.active);
      if (active) return;
      socket.connect();
    };

    const joinAdminRoom = () => {
      socket.emit("admin:join_orders", {}, () => {
        // ignore ack
      });
    };

    tryConnect();

    if (socket.connected) joinAdminRoom();
    else socket.once("connect", joinAdminRoom);

    const onAdminOrderMessage = (payload: any) => {
      const orderId = String(
        payload?.orderId || payload?.message?.orderId || ""
      ).trim();
      if (!orderId) return;

      // If admin is already viewing this order, don't increment unread.
      const path =
        typeof window !== "undefined" ? window.location.pathname || "" : "";
      const viewingThisOrder = path.startsWith(`/admin/orders/${orderId}`);

      if (!viewingThisOrder) {
        incrementAdminSupportUnread(orderId, 1);
      }

      const text = String(payload?.message?.message || "").trim();
      if (!text) return;

      // Keep the toast short and readable.
      const preview = text.length > 110 ? `${text.slice(0, 110)}…` : text;
      toast(`New message on #${shortOrder(orderId)}: ${preview}`, "info");
    };

    socket.on("admin:order_message", onAdminOrderMessage);

    return () => {
      socket.off("admin:order_message", onAdminOrderMessage);
      socket.off("connect", joinAdminRoom);
    };
  }, [ready, isAuthenticated, user?.role, toast]);

  return null;
}
