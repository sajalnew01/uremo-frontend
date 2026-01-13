"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

interface Order {
  _id: string;
  status: string;
  serviceId: {
    title: string;
    price: number;
  };
  payment?: {
    verifiedAt?: string | null;
  };
  createdAt?: string;
  expiresAt?: string | null;
  statusLog?: Array<{
    text: string;
    at: string;
  }>;
}

type OrderMessage = {
  _id: string;
  senderRole: "user" | "admin";
  message: string;
  createdAt: string;
};

export default function OrderDetailsPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { ready: authReady, isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [messageText, setMessageText] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [messageLoadError, setMessageLoadError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const chatSectionRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  const quickReplies = useMemo(
    () => [
      "I have paid, please verify.",
      "When will my service be delivered?",
      "I need urgent delivery.",
    ],
    []
  );

  const scrollToChat = (opts?: {
    focus?: boolean;
    behavior?: ScrollBehavior;
  }) => {
    const behavior = opts?.behavior || "smooth";
    chatSectionRef.current?.scrollIntoView({ behavior, block: "start" });
    if (opts?.focus) {
      // Mobile keyboards are more reliable when focus happens after a tick.
      window.setTimeout(() => {
        chatInputRef.current?.focus();
      }, 50);
    }
  };

  const isValidOrderId = useMemo(() => {
    // Mongo ObjectId (most common in this project)
    return /^[a-f\d]{24}$/i.test(String(orderId || ""));
  }, [orderId]);

  useEffect(() => {
    console.log("Chat endpoint:", `/api/orders/${orderId}/messages`);
  }, [orderId]);

  const loadOrder = async () => {
    setLoadError(null);
    setNotFound(false);

    if (!isValidOrderId) {
      setOrder(null);
      setNotFound(true);
      setLoading(false);
      return;
    }

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
      if (apiErr?.status === 401 || apiErr?.status === 403) {
        router.replace(
          `/login?next=${encodeURIComponent(`/orders/${orderId}`)}`
        );
        return;
      }

      if (apiErr?.status === 404) {
        setOrder(null);
        setNotFound(true);
        return;
      }

      setLoadError(apiErr?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    setMessageLoadError(null);
    try {
      const data = await apiRequest(
        `/api/orders/${orderId}/messages`,
        "GET",
        null,
        true
      );
      const list = Array.isArray(data) ? (data as OrderMessage[]) : [];
      // Defensive sort (backend already sorts, but keep UI stable).
      list.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(list);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.status === 401 || apiErr?.status === 403) {
        router.replace(
          `/login?next=${encodeURIComponent(`/orders/${orderId}`)}`
        );
        return;
      }

      const msg = apiErr?.message || "Failed to load messages";
      setMessageLoadError(msg);
    }
  };

  useEffect(() => {
    loadOrder();
    loadMessages();
  }, [orderId]);

  // Poll for new messages (reliability: prevents "stuck" chat)
  useEffect(() => {
    if (!isValidOrderId) return;
    if (!authReady || !isAuthenticated) return;

    const intervalMs = 5000;
    const id = window.setInterval(() => {
      // Avoid spamming while user is actively sending
      if (!sending) {
        loadMessages();
      }
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [orderId, isValidOrderId, sending, authReady, isAuthenticated]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // If deep-linked to chat via ?chat=1, open chat on load.
  useEffect(() => {
    const wantsChat = searchParams?.get("chat") === "1";
    if (!wantsChat) return;
    if (loading) return;
    if (!order) return;

    scrollToChat({ focus: true, behavior: "auto" });
  }, [searchParams, loading, order]);

  const isPendingPayment = order?.status === "payment_pending";
  const isPaymentVerified = Boolean(order?.payment?.verifiedAt);
  const expiresText = useMemo(() => {
    if (!isPendingPayment || !order?.expiresAt) return null;
    const expiresAt = new Date(order.expiresAt);
    return `Expires: ${expiresAt.toLocaleString()}`;
  }, [isPendingPayment, order?.expiresAt]);

  const sendMessage = async () => {
    const text = messageText.trim();
    if (!text) return;

    if (process.env.NODE_ENV !== "production") {
      console.log("sending", orderId, text);
    }

    setSendError(null);
    setSending(true);
    try {
      await apiRequest(
        `/api/orders/${orderId}/messages`,
        "POST",
        { message: text },
        true
      );
      setMessageText("");
      await loadMessages();
    } catch (err: any) {
      const msg = err?.message || "Failed to send message";
      setSendError(msg);
      toast(msg, "error");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading order...</div>;
  }

  if (notFound) {
    return (
      <div className="p-6 max-w-3xl space-y-3">
        <h1 className="text-xl font-semibold">Order not found</h1>
        <p className="text-sm text-[#9CA3AF]">
          This order doesn’t exist, or you don’t have access.
        </p>
        <button
          onClick={() => router.push("/orders")}
          className="btn-secondary w-fit"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6 max-w-3xl space-y-3">
        <h1 className="text-xl font-semibold">Couldn’t load order</h1>
        <p className="text-sm text-[#9CA3AF]">{loadError}</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setLoading(true);
              loadOrder();
            }}
            className="btn-primary w-fit"
          >
            Retry
          </button>
          <button
            onClick={() => router.push("/orders")}
            className="btn-secondary w-fit"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 max-w-3xl space-y-3">
        <h1 className="text-xl font-semibold">Order unavailable</h1>
        <button
          onClick={() => router.push("/orders")}
          className="btn-secondary w-fit"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <button
          onClick={() => router.push("/orders")}
          className="text-[#3B82F6] underline text-sm mb-4"
        >
          ← Back to Orders
        </button>
        <h1 className="text-3xl font-bold">Order Details</h1>
      </div>

      {/* Support banner */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-white">
              Need faster delivery?
            </p>
            <p className="mt-1 text-sm text-slate-200">
              Chat with UREMO support for verification & delivery updates.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border border-emerald-500/25 bg-emerald-500/10 text-emerald-200">
              🟢 Support active <span className="text-emerald-200/70">•</span>
              Replies usually within 5–10 minutes
            </div>
          </div>

          <button
            type="button"
            onClick={() => scrollToChat({ focus: true })}
            className="btn-primary"
          >
            Chat Now
          </button>
        </div>
      </div>

      {/* Order Info */}
      <div className="border border-[#1F2937] rounded-lg p-6 bg-[#0F172A]">
        <div className="space-y-3">
          <div>
            <p className="text-[#9CA3AF] text-sm">Order ID</p>
            <p className="font-mono text-sm">{order._id}</p>
          </div>

          <div>
            <p className="text-[#9CA3AF] text-sm">Service</p>
            <p className="text-lg font-semibold">{order.serviceId?.title}</p>
          </div>

          <div>
            <p className="text-[#9CA3AF] text-sm">Amount</p>
            <p className="text-2xl font-bold text-[#22C55E]">
              ${order.serviceId?.price}
            </p>
          </div>

          <div>
            <p className="text-[#9CA3AF] text-sm">Status</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block px-3 py-1 rounded bg-[#1F2937] text-sm">
                {order.status.replace(/_/g, " ")}
              </span>
              {isPaymentVerified && (
                <span className="inline-block px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm">
                  Payment verified ✅
                </span>
              )}
            </div>
            {expiresText && (
              <p className="text-xs text-[#9CA3AF] mt-2">{expiresText}</p>
            )}
          </div>

          {isPendingPayment && (
            <div>
              <button
                onClick={() => router.push(`/payment/${order._id}`)}
                className="inline-flex items-center justify-center px-4 py-2 rounded bg-[#3B82F6] text-white text-sm hover:bg-blue-500 transition"
              >
                Complete payment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="border border-[#1F2937] rounded-lg p-6 bg-[#0F172A]">
        <h3 className="font-semibold text-lg mb-4">Timeline</h3>

        <div className="space-y-3">
          {order.statusLog && order.statusLog.length > 0 ? (
            order.statusLog.map((entry, idx) => (
              <div
                key={idx}
                className="text-sm border-l-2 border-[#1F2937] pl-3 pb-3"
              >
                <div className="flex justify-between items-start">
                  <p className="text-[#9CA3AF]">
                    {new Date(entry.at).toLocaleString()}
                  </p>
                </div>
                <p className="mt-1 text-[#E5E7EB]">{entry.text}</p>
              </div>
            ))
          ) : (
            <p className="text-[#9CA3AF] text-sm">No timeline events yet.</p>
          )}
        </div>
      </div>

      {/* Chat */}
      <div
        ref={chatSectionRef}
        className="border border-[#1F2937] rounded-lg p-6 bg-[#0F172A]"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Order Support Chat</h3>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Message support for payment verification and delivery updates.
            </p>
          </div>
          <button
            type="button"
            onClick={loadMessages}
            className="text-xs text-[#9CA3AF] hover:text-white transition"
          >
            Refresh
          </button>
        </div>

        {messageLoadError && (
          <p className="mt-2 text-xs text-red-400">{messageLoadError}</p>
        )}

        <div className="mt-4 h-[360px] overflow-y-auto rounded-lg border border-[#1F2937] bg-[#020617] p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="mx-auto w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-xl text-white/80">
                  ✦
                </div>
                <p className="mt-3 text-sm text-slate-200 font-medium">
                  No messages yet. Support will reply here.
                </p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Use a quick reply to start the conversation.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {quickReplies.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setMessageText(q);
                        scrollToChat({ focus: true });
                      }}
                      className="px-3 py-1.5 rounded-full text-xs border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m._id}
                className={`flex ${
                  m.senderRole === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm border ${
                    m.senderRole === "user"
                      ? "bg-blue-600/20 border-blue-500/30 text-white"
                      : "bg-white/5 border-white/10 text-slate-200"
                  }`}
                >
                  <p className="text-[11px] text-[#9CA3AF] mb-1">
                    {m.senderRole === "user" ? "You" : "Support"}
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

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setMessageText(q);
                  scrollToChat({ focus: true });
                }}
                className="px-3 py-1.5 rounded-full text-xs border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              ref={chatInputRef}
              className="flex-1 rounded-lg border border-[#1F2937] bg-[#020617] px-3 py-2 text-sm text-white placeholder:text-[#64748B]"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                if (sendError) setSendError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={sending}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={sending || !messageText.trim()}
              className="px-4 py-2 rounded-lg bg-[#3B82F6] text-white text-sm disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>

        {sendError && <p className="mt-2 text-xs text-red-400">{sendError}</p>}

        <p className="mt-3 text-xs text-[#9CA3AF]">
          Support replies from admin will appear here.
        </p>
      </div>
    </div>
  );
}
