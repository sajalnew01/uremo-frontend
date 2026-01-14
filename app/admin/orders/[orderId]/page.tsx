"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/Card";
import { apiRequest, ApiError, getApiBaseUrl } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import InlineError from "@/components/ui/InlineError";
import FilePreview from "@/components/FilePreview";
import { useAuth } from "@/hooks/useAuth";

type StatusLogItem = { text: string; at: string };

type OrderMessage = {
  _id: string;
  senderRole: "user" | "admin";
  message: string;
  createdAt: string;
};

type Order = {
  _id: string;
  status: string;
  createdAt: string;
  expiresAt?: string | null;
  statusLog?: StatusLogItem[];
  userId?: { email: string };
  serviceId?: { title: string; price: number };
  payment?: {
    methodId?: { name: string };
    reference?: string;
    proofUrl?: string;
    proofResourceType?: "image" | "raw";
    proofFormat?: string;
    submittedAt?: string;
  };
};

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { toast } = useToast();
  const { ready: authReady, isAuthenticated } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [chatConnection, setChatConnection] = useState<
    "connecting" | "open" | "offline" | "unsupported"
  >("connecting");
  const [streamKey, setStreamKey] = useState(0);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  const stopPolling = () => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollTimerRef.current = window.setInterval(() => {
      if (!sending) loadMessages();
    }, 5000);
  };

  const loadOrder = async () => {
    setOrderError(null);
    try {
      const data = await apiRequest(
        `/api/orders/${orderId}`,
        "GET",
        null,
        true
      );
      setOrder(data);
    } catch (err) {
      const apiErr = err as ApiError;
      console.warn("[admin order] loadOrder failed:", apiErr?.message);
      setOrderError("Unable to load order");
    } finally {
      setOrderLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await apiRequest(
        `/api/orders/${orderId}/messages`,
        "GET",
        null,
        true
      );
      const list = Array.isArray(data) ? (data as OrderMessage[]) : [];
      list.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(list);

      const nextSeen = new Set<string>();
      for (const msg of list) {
        if (msg?._id) nextSeen.add(String(msg._id));
      }
      seenMessageIdsRef.current = nextSeen;

      setMessagesError(null);
    } catch (err) {
      const apiErr = err as ApiError;
      console.warn("[admin order] loadMessages failed:", apiErr?.message);
      setMessagesError("Unable to load chat");
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    loadMessages();

    return () => {
      stopPolling();
      const existing = eventSourceRef.current;
      if (existing) {
        try {
          existing.close();
        } catch {}
        eventSourceRef.current = null;
      }
    };
  }, [orderId]);

  // Realtime: SSE stream. Fallback to polling when unsupported/offline.
  useEffect(() => {
    const existing = eventSourceRef.current;
    if (existing) {
      try {
        existing.close();
      } catch {}
      eventSourceRef.current = null;
    }
    stopPolling();

    if (!authReady || !isAuthenticated) {
      setChatConnection("offline");
      return;
    }

    if (typeof window === "undefined") return;
    if (typeof EventSource === "undefined") {
      setChatConnection("unsupported");
      startPolling();
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setChatConnection("offline");
      startPolling();
      return;
    }

    setChatConnection("connecting");

    const url = `${getApiBaseUrl()}/api/orders/${orderId}/messages/stream?token=${encodeURIComponent(
      token
    )}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setChatConnection("open");
    };

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const msg = parsed as OrderMessage;
        const id = msg?._id ? String(msg._id) : null;
        if (!id) return;
        if (seenMessageIdsRef.current.has(id)) return;

        seenMessageIdsRef.current.add(id);
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === id)) return prev;
          const next = [...prev, msg];
          next.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return next;
        });
      } catch {
        // Ignore malformed stream packets
      }
    };

    es.onerror = () => {
      setChatConnection("offline");
      try {
        es.close();
      } catch {}
      if (eventSourceRef.current === es) eventSourceRef.current = null;
      startPolling();
    };

    return () => {
      try {
        es.close();
      } catch {}
      if (eventSourceRef.current === es) eventSourceRef.current = null;
      stopPolling();
    };
  }, [orderId, authReady, isAuthenticated, streamKey]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const badge = (status: string) => {
    const map: Record<string, string> = {
      payment_pending: "bg-blue-600",
      payment_submitted: "bg-yellow-600",
      processing: "bg-purple-600",
      completed: "bg-green-600",
      rejected: "bg-red-600",
    };
    return map[status] || "bg-gray-600";
  };

  const updateStatus = async (status: string) => {
    if (!order) return;
    try {
      await apiRequest(
        `/api/admin/orders/${order._id}`,
        "PUT",
        { status },
        true
      );
      await loadOrder();
      toast("Status updated", "success");
    } catch (err) {
      const apiErr = err as ApiError;
      console.warn("[admin order] updateStatus failed:", apiErr?.message);
      toast("Failed to update status", "error");
    }
  };

  const sendReply = async () => {
    const text = reply.trim();
    if (!text) return;

    if (!authReady || !isAuthenticated) {
      toast("Please login to send messages", "error");
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const optimisticMessage: OrderMessage = {
      _id: tempId,
      senderRole: "admin",
      message: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => {
      const next = [...prev, optimisticMessage];
      next.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return next;
    });
    setReply("");

    setSending(true);
    setSendError(null);
    try {
      const created = await apiRequest<OrderMessage>(
        `/api/orders/${orderId}/messages`,
        "POST",
        { message: text },
        true
      );

      setMessages((prev) => {
        const hasConfirmed = prev.some(
          (m) => String(m._id) === String(created._id)
        );
        const withoutTemp = prev.filter((m) => m._id !== tempId);
        if (hasConfirmed) return withoutTemp;
        const next = [...withoutTemp, created];
        next.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return next;
      });
      if (created?._id) {
        seenMessageIdsRef.current.add(String(created._id));
      }
      toast("Reply sent", "success");
    } catch (err) {
      const apiErr = err as ApiError;
      console.warn("[admin order] sendReply failed:", apiErr?.message);
      // Show safe message, never raw backend errors
      setSendError("Could not send reply. Please retry.");
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      toast("Could not send reply. Please retry.", "error");
    } finally {
      setSending(false);
    }
  };

  if (orderLoading) {
    return <div className="p-6 text-sm text-[#9CA3AF]">Loading order…</div>;
  }

  if (orderError) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-red-400">{orderError}</p>
        <button
          onClick={() => {
            setOrderLoading(true);
            loadOrder();
          }}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!order) {
    return <div className="p-6 text-sm text-[#9CA3AF]">Order not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin — Order</h1>
        <span className={`text-xs px-2 py-1 rounded ${badge(order.status)}`}>
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="space-y-2">
            <p className="text-sm text-[#9CA3AF]">User</p>
            <p className="text-white font-semibold">{order.userId?.email}</p>
            <p className="text-sm text-[#9CA3AF] mt-3">Service</p>
            <p className="text-white font-semibold">{order.serviceId?.title}</p>
            <p className="text-sm text-[#9CA3AF] mt-3">Amount</p>
            <p className="text-white font-semibold">
              ${order.serviceId?.price ?? "—"}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-3">
              Created: {new Date(order.createdAt).toLocaleString()}
            </p>
            {order.expiresAt && order.status === "payment_pending" && (
              <p className="text-xs text-[#9CA3AF]">
                Expires: {new Date(order.expiresAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="mt-5 flex gap-2 flex-wrap">
            <select
              className="px-3 py-2 text-sm rounded bg-[#020617] border border-[#1F2937] text-white"
              value={order.status}
              onChange={(e) => updateStatus(e.target.value)}
            >
              <option value="payment_pending">payment pending</option>
              <option value="payment_submitted">payment submitted</option>
              <option value="processing">processing</option>
              <option value="completed">completed</option>
              <option value="rejected">rejected</option>
            </select>

            {order.payment?.proofUrl && (
              <FilePreview
                url={order.payment.proofUrl}
                label="View proof"
                type={
                  order.payment.proofResourceType === "raw" ? "raw" : "image"
                }
              />
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-lg mb-3">Timeline</h3>
          <div className="space-y-3">
            {order.statusLog && order.statusLog.length > 0 ? (
              order.statusLog.map((t, idx) => (
                <div
                  key={idx}
                  className="text-sm border-l-2 border-white/10 pl-3"
                >
                  <p className="text-[#9CA3AF] text-xs">
                    {new Date(t.at).toLocaleString()}
                  </p>
                  <p className="text-slate-200 mt-1">{t.text}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#9CA3AF]">No timeline yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Chat</h3>
          <div className="flex items-center gap-3">
            <span
              className={`text-[11px] px-2 py-1 rounded-full border ${
                chatConnection === "open"
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                  : chatConnection === "connecting"
                  ? "border-blue-500/25 bg-blue-500/10 text-blue-200"
                  : "border-white/10 bg-white/5 text-[#9CA3AF]"
              }`}
            >
              {chatConnection === "open"
                ? "Live"
                : chatConnection === "connecting"
                ? "Connecting…"
                : chatConnection === "unsupported"
                ? "Realtime unavailable"
                : "Offline"}
            </span>

            {chatConnection !== "open" && (
              <button
                type="button"
                onClick={() => setStreamKey((k) => k + 1)}
                className="text-sm text-[#9CA3AF] hover:text-white"
              >
                Retry
              </button>
            )}

            <button
              type="button"
              onClick={() => loadMessages()}
              className="text-sm text-[#9CA3AF] hover:text-white"
            >
              Refresh
            </button>
          </div>
        </div>

        {sendError && (
          <div className="mt-3">
            <InlineError title="Couldn’t send reply" message={sendError} />
          </div>
        )}

        <div className="mt-4 h-[420px] overflow-y-auto rounded-lg border border-white/10 bg-[#020617] p-4 space-y-3">
          {messagesLoading ? (
            <p className="text-sm text-[#9CA3AF]">Loading chat…</p>
          ) : messagesError ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <p className="text-sm text-red-400">{messagesError}</p>
              <button
                onClick={() => loadMessages()}
                className="text-xs text-blue-400 hover:underline"
              >
                Tap to refresh
              </button>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">No messages yet.</p>
          ) : (
            messages.map((m) => (
              <div
                key={m._id}
                className={`flex ${
                  m.senderRole === "admin" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm border ${
                    m.senderRole === "admin"
                      ? "bg-blue-600/20 border-blue-500/30 text-white"
                      : "bg-white/5 border-white/10 text-slate-200"
                  }`}
                >
                  <p className="text-[11px] text-[#9CA3AF] mb-1">
                    {m.senderRole === "admin" ? "You" : "User"}
                  </p>
                  <p className="whitespace-pre-wrap">{m.message}</p>
                  <p className="mt-1 text-[11px] text-[#9CA3AF]">
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm text-white placeholder:text-[#64748B]"
            placeholder="Reply to user…"
            value={reply}
            onChange={(e) => {
              setReply(e.target.value);
              if (sendError) setSendError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendReply();
              }
            }}
            disabled={sending}
          />
          <button
            type="button"
            onClick={sendReply}
            disabled={
              sending || !reply.trim() || !authReady || !isAuthenticated
            }
            className="px-4 py-2 rounded-lg bg-[#3B82F6] text-white text-sm disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </Card>
    </div>
  );
}
