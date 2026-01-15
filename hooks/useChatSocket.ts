"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { apiRequest, getApiBaseUrl } from "@/lib/api";

export type MessageStatus = "sending" | "sent" | "delivered" | "seen" | "failed";

export type ChatMessage = {
  _id: string;
  tempId?: string;
  orderId: string;
  senderId?: string;
  senderRole: "user" | "admin";
  message: string;
  status: MessageStatus;
  createdAt: string;
  deliveredAt?: string | null;
  seenAt?: string | null;
  optimistic?: boolean;
};

type TypingState = {
  userId: string;
  role: string;
  isTyping: boolean;
};

type UseChatSocketOptions = {
  orderId: string | null;
  enabled: boolean;
  onError?: (error: string) => void;
};

const RETRY_QUEUE_KEY = "uremo_chat_retry_queue";

/**
 * Load retry queue from localStorage.
 */
function loadRetryQueue(): Array<{ orderId: string; message: string; tempId: string }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RETRY_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save retry queue to localStorage.
 */
function saveRetryQueue(queue: Array<{ orderId: string; message: string; tempId: string }>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Generate a unique temp ID for optimistic messages.
 */
function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function useChatSocket(options: UseChatSocketOptions) {
  const { orderId, enabled, onError } = options;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingState[]>([]);
  const [retryQueue, setRetryQueue] = useState<Array<{ orderId: string; message: string; tempId: string }>>([]);

  const socketRef = useRef<Socket | null>(null);
  const currentOrderIdRef = useRef<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const retryTimerRef = useRef<number | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const joinAttemptIdRef = useRef(0);
  const pollTimerRef = useRef<number | null>(null);

  // Load retry queue on mount
  useEffect(() => {
    setRetryQueue(loadRetryQueue());
  }, []);

  // Connect to socket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) {
      onError?.("No auth token");
      return;
    }

    setConnecting(true);
    setJoined(false);
    setJoining(false);

    const baseUrl = getApiBaseUrl();
    const socket = io(baseUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    const joinOrderWithAck = (targetOrderId: string) => {
      if (!targetOrderId) return;
      if (!socket.connected) return;

      // Prevent stale ACKs from old join attempts.
      const attemptId = ++joinAttemptIdRef.current;
      setJoining(true);
      setJoined(false);

      let done = false;
      const t = window.setTimeout(() => {
        if (done) return;
        done = true;
        if (attemptId !== joinAttemptIdRef.current) return;
        setJoining(false);
        setJoined(false);
        onError?.("JOIN_ACK_TIMEOUT");
      }, 8000);

      socket.emit("join:order", { orderId: targetOrderId }, (ack: any) => {
        if (done) return;
        done = true;
        window.clearTimeout(t);
        if (attemptId !== joinAttemptIdRef.current) return;

        if (ack?.ok) {
          setJoined(true);
          setJoining(false);
        } else {
          setJoined(false);
          setJoining(false);
          onError?.(String(ack?.error || "JOIN_FAILED"));
        }
      });
    };

    socket.on("connect", () => {
      console.log("[Socket] Connected");
      setConnected(true);
      setConnecting(false);
      setJoined(false);
      setJoining(false);

      // Rejoin order room if we were in one
      if (currentOrderIdRef.current) {
        joinOrderWithAck(currentOrderIdRef.current);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      setConnected(false);
      setJoined(false);
      setJoining(false);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
      setConnecting(false);
      setConnected(false);
      setJoined(false);
      setJoining(false);
    });

    socket.on("error", (data) => {
      console.error("[Socket] Error:", data?.message);
      onError?.(data?.message || "Socket error");
    });

    // Message history on join
    socket.on("messages:history", (data) => {
      const history = Array.isArray(data?.messages) ? data.messages : [];
      const sorted = [...history].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setMessages((prev) => {
        const optimistic = prev.filter((m) => m.optimistic);
        const byId = new Map<string, ChatMessage>();

        for (const msg of sorted) {
          if (msg?._id) byId.set(String(msg._id), { ...msg, optimistic: false });
        }

        // Keep optimistic messages that haven't been reconciled yet.
        for (const opt of optimistic) {
          if (opt?._id && byId.has(String(opt._id))) continue;
          byId.set(String(opt._id), opt);
        }

        const next = Array.from(byId.values());
        next.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return next;
      });

      const nextSeen = new Set<string>(seenIdsRef.current);
      for (const msg of sorted) {
        if (msg?._id) nextSeen.add(String(msg._id));
      }
      seenIdsRef.current = nextSeen;
    });

    // New message
    socket.on("message:new", (msg: ChatMessage) => {
      const id = String(msg?._id || "");
      const tempId = msg?.tempId;

      setMessages((prev) => {
        // Skip if already present by id
        if (id && prev.some((m) => String(m._id) === id)) return prev;

        // If this is a server-confirmed version of an optimistic message, reconcile it.
        if (tempId) {
          const idx = prev.findIndex((m) => m.tempId === tempId || m._id === tempId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              ...msg,
              _id: id || next[idx]._id,
              status: msg.status || "sent",
              optimistic: false,
            };
            next.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            return next;
          }
        }

        const next = [...prev, { ...msg, optimistic: false }];
        next.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return next;
      });

      if (id) seenIdsRef.current.add(id);

      // Remove from retry queue if present
      if (tempId) {
        setRetryQueue((q) => {
          const updated = q.filter((item) => item.tempId !== tempId);
          saveRetryQueue(updated);
          return updated;
        });
      }
    });

    // Message status update
    socket.on("message:status", (data: { messageIds: string[]; status: MessageStatus }) => {
      const { messageIds, status } = data;
      if (!Array.isArray(messageIds) || messageIds.length === 0) return;

      setMessages((prev) =>
        prev.map((m) => (messageIds.includes(String(m._id)) ? { ...m, status } : m))
      );
    });

    // Message send error
    socket.on("message:error", (data: { tempId?: string; error: string }) => {
      const { tempId, error } = data;
      console.error("[Socket] Message error:", error);

      if (tempId) {
        setMessages((prev) =>
          prev.map((m) => (m.tempId === tempId ? { ...m, status: "failed" } : m))
        );
      }

      onError?.(error);
    });

    // Typing indicator
    socket.on("typing:update", (data: TypingState) => {
      setTypingUsers((prev) => {
        const exists = prev.find((t) => t.userId === data.userId);
        if (data.isTyping) {
          return exists
            ? prev.map((t) => (t.userId === data.userId ? data : t))
            : [...prev, data];
        } else {
          return prev.filter((t) => t.userId !== data.userId);
        }
      });
    });

    socketRef.current = socket;
  }, [onError]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnected(false);
    setConnecting(false);
    setJoined(false);
    setJoining(false);
  }, []);

  // Join order room
  const joinOrder = useCallback((newOrderId: string) => {
    currentOrderIdRef.current = newOrderId;
    seenIdsRef.current.clear();
    setMessages([]);
    setJoined(false);
    setJoining(false);

    if (socketRef.current?.connected) {
      const socket = socketRef.current;
      const attemptId = ++joinAttemptIdRef.current;
      setJoining(true);

      let done = false;
      const t = window.setTimeout(() => {
        if (done) return;
        done = true;
        if (attemptId !== joinAttemptIdRef.current) return;
        setJoining(false);
        setJoined(false);
        onError?.("JOIN_ACK_TIMEOUT");
      }, 8000);

      socket.emit("join:order", { orderId: newOrderId }, (ack: any) => {
        if (done) return;
        done = true;
        window.clearTimeout(t);
        if (attemptId !== joinAttemptIdRef.current) return;

        if (ack?.ok) {
          setJoined(true);
          setJoining(false);
        } else {
          setJoined(false);
          setJoining(false);
          onError?.(String(ack?.error || "JOIN_FAILED"));
        }
      });
    }
  }, [onError]);

  // Leave order room
  const leaveOrder = useCallback(() => {
    if (socketRef.current?.connected && currentOrderIdRef.current) {
      socketRef.current.emit("leave:order");
    }
    currentOrderIdRef.current = null;
    setMessages([]);
    setJoined(false);
    setJoining(false);
  }, []);

  // Send message
  const sendMessage = useCallback((text: string) => {
    const message = text.trim();
    if (!message || !currentOrderIdRef.current) return null;

    const tempId = generateTempId();
    const orderId = currentOrderIdRef.current;

    // Optimistic message
    const optimisticMsg: ChatMessage = {
      _id: tempId,
      tempId,
      orderId,
      senderRole: "user", // Will be overwritten by server
      message,
      status: "sending",
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    const enqueueRetry = () => {
      const queueItem = { orderId, message, tempId };
      setRetryQueue((q) => {
        // de-dupe by tempId
        if (q.some((x) => x.tempId === tempId)) return q;
        const updated = [...q, queueItem];
        saveRetryQueue(updated);
        return updated;
      });
    };

    // Only allow sending when connected + joined.
    if (socketRef.current?.connected && joined) {
      const socket = socketRef.current;

      let done = false;
      const t = window.setTimeout(() => {
        if (done) return;
        done = true;
        setMessages((prev) =>
          prev.map((m) => (m.tempId === tempId ? { ...m, status: "failed" } : m))
        );
        enqueueRetry();
        onError?.("SEND_ACK_TIMEOUT");
      }, 8000);

      socket.emit(
        "message:send",
        { orderId, tempId, text: message },
        (ack: any) => {
          if (done) return;
          done = true;
          window.clearTimeout(t);

          if (ack?.ok && ack?.message?._id) {
            const serverMsg = ack.message as ChatMessage;
            const serverId = String(serverMsg._id);
            seenIdsRef.current.add(serverId);

            setMessages((prev) =>
              prev.map((m) =>
                m.tempId === tempId
                  ? {
                      ...m,
                      ...serverMsg,
                      _id: serverId,
                      status: "sent",
                      optimistic: false,
                    }
                  : m
              )
            );
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.tempId === tempId ? { ...m, status: "failed" } : m
              )
            );
            enqueueRetry();
            onError?.(String(ack?.error || "SEND_FAILED"));
          }
        }
      );
    } else {
      // Add to retry queue
      enqueueRetry();

      // Mark as failed for now
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status: "failed" } : m))
      );
    }

    return tempId;
  }, [joined, onError]);

  // Retry failed message
  const retryMessage = useCallback((tempId: string) => {
    const item = retryQueue.find((q) => q.tempId === tempId);
    if (!item) return;

    // Update status to sending
    setMessages((prev) =>
      prev.map((m) => (m.tempId === tempId ? { ...m, status: "sending" } : m))
    );

    if (socketRef.current?.connected && joined) {
      const socket = socketRef.current;

      let done = false;
      const t = window.setTimeout(() => {
        if (done) return;
        done = true;
        setMessages((prev) =>
          prev.map((m) => (m.tempId === tempId ? { ...m, status: "failed" } : m))
        );
        onError?.("SEND_ACK_TIMEOUT");
      }, 8000);

      socket.emit(
        "message:send",
        { orderId: item.orderId, tempId, text: item.message },
        (ack: any) => {
          if (done) return;
          done = true;
          window.clearTimeout(t);

          if (ack?.ok && ack?.message?._id) {
            const serverMsg = ack.message as ChatMessage;
            const serverId = String(serverMsg._id);
            seenIdsRef.current.add(serverId);

            setMessages((prev) =>
              prev.map((m) =>
                m.tempId === tempId
                  ? {
                      ...m,
                      ...serverMsg,
                      _id: serverId,
                      status: "sent",
                      optimistic: false,
                    }
                  : m
              )
            );

            setRetryQueue((q) => {
              const updated = q.filter((x) => x.tempId !== tempId);
              saveRetryQueue(updated);
              return updated;
            });
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.tempId === tempId ? { ...m, status: "failed" } : m
              )
            );
            onError?.(String(ack?.error || "SEND_FAILED"));
          }
        }
      );
    }
  }, [retryQueue, joined, onError]);

  // Mark messages as delivered
  const markDelivered = useCallback((messageIds: string[]) => {
    if (!socketRef.current?.connected || messageIds.length === 0) return;
    socketRef.current.emit("message:delivered", { messageIds });
  }, []);

  // Mark messages as seen
  const markSeen = useCallback((messageIds: string[]) => {
    if (!socketRef.current?.connected || messageIds.length === 0) return;
    socketRef.current.emit("message:seen", { messageIds });
  }, []);

  // Typing indicator
  const startTyping = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("typing:start");

    // Auto-stop after 3 seconds
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = window.setTimeout(() => {
      socketRef.current?.emit("typing:stop");
    }, 3000);
  }, []);

  const stopTyping = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("typing:stop");

    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, []);

  // Process retry queue when connected
  useEffect(() => {
    if (!connected || !joined || retryQueue.length === 0) return;

    // Retry failed messages for current order
    const currentOrderRetries = retryQueue.filter(
      (item) => item.orderId === currentOrderIdRef.current
    );

    if (currentOrderRetries.length === 0) return;

    // Retry with small delay between each
    let index = 0;
    const processNext = () => {
      if (index >= currentOrderRetries.length) return;

      const item = currentOrderRetries[index];
      if (socketRef.current?.connected && joined) {
        socketRef.current.emit("message:send", {
          orderId: item.orderId,
          text: item.message,
          tempId: item.tempId,
        });

        // Update status
        setMessages((prev) =>
          prev.map((m) =>
            m.tempId === item.tempId ? { ...m, status: "sending" } : m
          )
        );
      }

      index++;
      retryTimerRef.current = window.setTimeout(processNext, 500);
    };

    processNext();

    return () => {
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
      }
    };
  }, [connected, joined, retryQueue]);

  // Fallback polling safety net when socket is disconnected
  useEffect(() => {
    if (!enabled) return;
    if (!orderId) return;
    if (connected) return;

    const poll = async () => {
      try {
        const list = await apiRequest<ChatMessage[]>(
          `/api/orders/${orderId}/messages`,
          "GET",
          null,
          true
        );

        const serverMessages = Array.isArray(list) ? list : [];
        setMessages((prev) => {
          const byId = new Map<string, ChatMessage>();
          for (const m of prev) {
            if (!m?._id) continue;
            byId.set(String(m._id), m);
          }
          for (const sm of serverMessages) {
            const sid = String((sm as any)?._id || "");
            if (!sid) continue;
            if (byId.has(sid)) continue;
            byId.set(sid, { ...(sm as any), optimistic: false });
          }
          const next = Array.from(byId.values());
          next.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return next;
        });

        // update seen ids
        const nextSeen = new Set<string>(seenIdsRef.current);
        for (const sm of serverMessages) {
          if (sm?._id) nextSeen.add(String(sm._id));
        }
        seenIdsRef.current = nextSeen;
      } catch {
        // ignore
      }
    };

    poll();
    pollTimerRef.current = window.setInterval(poll, 10_000);
    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [enabled, orderId, connected]);

  // Connect/disconnect based on enabled flag
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Join/leave order room when orderId changes
  useEffect(() => {
    if (!orderId) {
      leaveOrder();
      return;
    }

    if (connected) {
      joinOrder(orderId);
    }
  }, [orderId, connected, joinOrder, leaveOrder]);

  return {
    connected,
    connecting,
    joined,
    joining,
    messages,
    typingUsers,
    retryQueue,
    sendMessage,
    retryMessage,
    markDelivered,
    markSeen,
    startTyping,
    stopTyping,
    reconnect: connect,
  };
}
