"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/Card";
import { apiRequest, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import InlineError from "@/components/ui/InlineError";
import FilePreview from "@/components/FilePreview";
import { useAuth } from "@/hooks/useAuth";
import {
  useChatSocket,
  ChatMessage,
  MessageStatus,
} from "@/hooks/useChatSocket";
import { clearAdminSupportUnreadForOrder } from "@/lib/supportUnread";
import {
  ActionBar,
  AuditTrail,
  StatusTooltip,
  UndoToast,
  useUndoToast,
} from "@/components/admin/v2";

type StatusLogItem = { text: string; at: string };

type OrderMessage = ChatMessage;

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
  const undoToast = useUndoToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastVerifiedData, setLastVerifiedData] = useState<{
    orderId: string;
    previousStatus: string;
  } | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Status modal state for completion/cancellation
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    status: string;
    inputValue: string;
  }>({ open: false, status: "", inputValue: "" });

  // Socket.io realtime chat
  const {
    connected,
    connecting,
    joined,
    messages,
    typingUsers,
    sendMessage: socketSendMessage,
    retryMessage,
    markSeen,
    startTyping,
    reconnect,
  } = useChatSocket({
    orderId: orderId || null,
    enabled: authReady && isAuthenticated && Boolean(orderId),
    onError: (err) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Socket] Error:", err);
      }
    },
  });

  // Chat connection status
  const chatConnection = useMemo(() => {
    if (connecting) return "connecting";
    if (connected && joined) return "open";
    return "offline";
  }, [connected, joined, connecting]);

  // Check if any message is currently sending
  const sending = useMemo(() => {
    return messages.some((m) => m.status === "sending");
  }, [messages]);

  // Get status indicator for a message
  const getMessageStatusIcon = (status: MessageStatus): string | null => {
    switch (status) {
      case "sending":
        return "⏳";
      case "sent":
        return "✓";
      case "delivered":
        return "✓✓";
      case "seen":
        return "✓✓";
      case "failed":
        return "⚠️";
      default:
        return null;
    }
  };

  const getMessageStatusClass = (status: MessageStatus): string => {
    switch (status) {
      case "sending":
        return "text-slate-400";
      case "sent":
        return "text-slate-400";
      case "delivered":
        return "text-blue-400";
      case "seen":
        return "text-emerald-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  const loadOrder = async () => {
    setOrderError(null);
    try {
      const data = await apiRequest(
        `/api/orders/${orderId}`,
        "GET",
        null,
        true,
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

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  // Clear unread badge for this order when opened (best-effort)
  useEffect(() => {
    if (!orderId) return;
    clearAdminSupportUnreadForOrder(String(orderId));

    // REST fallback: mark all user->admin messages as read even if socket is offline
    (async () => {
      try {
        await apiRequest(
          `/api/admin/orders/${orderId}/support/mark-read`,
          "POST",
          {},
          true,
        );
      } catch {
        // ignore
      }
    })();
  }, [orderId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark user messages as seen
  useEffect(() => {
    const unreadIds = messages
      .filter((m) => m.senderRole === "user" && m.status !== "seen")
      .map((m) => m._id);
    if (unreadIds.length > 0) {
      markSeen(unreadIds);
    }
  }, [messages, markSeen]);

  const badge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-blue-600",
      waiting_user: "bg-yellow-600",
      in_progress: "bg-purple-600",
      completed: "bg-green-600",
      cancelled: "bg-red-600",
    };
    return map[status] || "bg-gray-600";
  };

  const updateStatus = async (status: string, noteOrReason?: string) => {
    if (!order) return;
    const previousStatus = order.status;

    // If completing or cancelling without note/reason, open modal
    if (status === "completed" && !noteOrReason) {
      setStatusModal({ open: true, status: "completed", inputValue: "" });
      return;
    }
    if (status === "cancelled" && !noteOrReason) {
      setStatusModal({ open: true, status: "cancelled", inputValue: "" });
      return;
    }

    try {
      const payload: { status: string; note?: string; reason?: string } = {
        status,
      };
      if (status === "completed") payload.note = noteOrReason;
      if (status === "cancelled") payload.reason = noteOrReason;

      await apiRequest(`/api/admin/orders/${order._id}`, "PUT", payload, true);
      await loadOrder();
      toast("Status updated", "success");

      // If verifying payment, show undo toast
      if (status === "in_progress" && previousStatus === "pending") {
        setLastVerifiedData({ orderId: order._id, previousStatus });
        undoToast.showUndo("Payment verified", async () => {
          if (lastVerifiedData) {
            await apiRequest(
              `/api/admin/orders/${lastVerifiedData.orderId}`,
              "PUT",
              { status: lastVerifiedData.previousStatus },
              true,
            );
            await loadOrder();
            toast("Verification undone", "info");
          }
        });
      }
    } catch (err) {
      const apiErr = err as ApiError;
      console.warn("[admin order] updateStatus failed:", apiErr?.message);
      toast("Failed to update status", "error");
    }
  };

  // Handle modal confirmation
  const handleStatusModalConfirm = () => {
    if (!statusModal.inputValue.trim()) {
      toast(
        statusModal.status === "completed"
          ? "Completion note required"
          : "Cancellation reason required",
        "error",
      );
      return;
    }
    updateStatus(statusModal.status, statusModal.inputValue.trim());
    setStatusModal({ open: false, status: "", inputValue: "" });
  };

  const sendReply = () => {
    const text = reply.trim();
    if (!text) return;

    if (!authReady || !isAuthenticated) {
      toast("Please login to send messages", "error");
      return;
    }

    socketSendMessage(text);
    setReply("");
    setSendError(null);
    toast("Reply sent", "success");
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
        <StatusTooltip status={order.status}>
          <span className={`text-xs px-2 py-1 rounded ${badge(order.status)}`}>
            {order.status.replace(/_/g, " ")}
          </span>
        </StatusTooltip>
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
            {order.expiresAt && order.status === "pending" && (
              <p className="text-xs text-[#9CA3AF]">
                Expires: {new Date(order.expiresAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="mt-5 space-y-2">
            {/* PATCH_77: Demote dropdown, guide admin to action buttons */}
            <p className="text-xs text-cyan-400 font-medium">
              ↓ Use the action buttons below to proceed
            </p>
            <details className="group">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                Advanced: Manual status change
              </summary>
              <div className="flex gap-2 flex-wrap mt-2">
                <select
                  className="px-3 py-2 text-sm rounded bg-[#020617] border border-[#1F2937] text-white opacity-70"
                  value={order.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={
                    order.status === "completed" || order.status === "cancelled"
                  }
                  title={
                    order.status === "completed"
                      ? "Order complete. No further changes."
                      : order.status === "cancelled"
                        ? "Order cancelled. No changes allowed."
                        : "Change order status"
                  }
                >
                  <option value="pending">pending</option>
                  <option value="waiting_user">waiting user</option>
                  <option value="in_progress">in progress</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
            </details>
            {(order.status === "completed" || order.status === "cancelled") && (
              <p className="text-xs text-amber-400/80">
                🔒 This order is finalized. Status cannot be changed.
              </p>
            )}
          </div>

          {order.payment?.proofUrl && (
            <FilePreview
              url={order.payment.proofUrl}
              label="View proof"
              type={order.payment.proofResourceType === "raw" ? "raw" : "image"}
            />
          )}
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

      {/* Safety Layer: ActionBar */}
      <ActionBar
        actions={[
          {
            key: "verify",
            label: "Verify Payment",
            icon: "✓",
            variant: "success",
            disabled: order.status !== "pending",
            onClick: () => updateStatus("in_progress"),
          },
          {
            key: "complete",
            label: "Complete Order",
            icon: "✓",
            variant: "success",
            disabled:
              order.status === "completed" || order.status === "cancelled",
            onClick: () => updateStatus("completed"),
          },
          {
            key: "waiting",
            label: "Awaiting User",
            icon: "⏳",
            variant: "warning",
            disabled:
              order.status === "completed" || order.status === "cancelled",
            onClick: () => updateStatus("waiting_user"),
          },
          {
            key: "cancel",
            label: "Cancel Order",
            icon: "✕",
            variant: "danger",
            disabled:
              order.status === "completed" || order.status === "cancelled",
            onClick: () => updateStatus("cancelled"),
          },
        ]}
      />

      {/* Safety Layer: AuditTrail */}
      <Card>
        <h3 className="font-semibold text-lg mb-3">Audit Trail</h3>
        <AuditTrail
          events={
            order.statusLog?.map((entry, idx) => ({
              id: `order-log-${idx}`,
              action: entry.text,
              timestamp: entry.at,
              actor: "System",
              details: `Order status change`,
            })) || []
          }
        />
      </Card>

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
                ? "🟢 Live"
                : chatConnection === "connecting"
                  ? "Connecting…"
                  : "Offline"}
            </span>

            {chatConnection !== "open" && (
              <button
                type="button"
                onClick={reconnect}
                className="text-sm text-[#9CA3AF] hover:text-white"
              >
                Retry
              </button>
            )}
          </div>
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="mt-2 text-xs text-slate-400 animate-pulse">
            {typingUsers.map((t) => t.role).join(", ")} typing...
          </div>
        )}

        {sendError && (
          <div className="mt-3">
            <InlineError title="Couldn’t send reply" message={sendError} />
          </div>
        )}

        <div className="mt-4 h-[420px] overflow-y-auto rounded-lg border border-white/10 bg-[#020617] p-4 space-y-3">
          {messages.length === 0 ? (
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
                      ? m.status === "failed"
                        ? "bg-red-600/20 border-red-500/30 text-white"
                        : "bg-blue-600/20 border-blue-500/30 text-white"
                      : "bg-white/5 border-white/10 text-slate-200"
                  }`}
                >
                  <p className="text-[11px] text-[#9CA3AF] mb-1">
                    {m.senderRole === "admin" ? "You" : "User"}
                  </p>
                  <p className="whitespace-pre-wrap">{m.message}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-[11px] text-[#9CA3AF]">
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                    {/* Status indicator for admin messages */}
                    {m.senderRole === "admin" && m.status && (
                      <span
                        className={`text-[11px] ${getMessageStatusClass(
                          m.status,
                        )}`}
                        title={m.status}
                      >
                        {getMessageStatusIcon(m.status)}
                      </span>
                    )}
                    {/* Retry button for failed messages */}
                    {m.status === "failed" && m.tempId && (
                      <button
                        type="button"
                        onClick={() => retryMessage(m.tempId!)}
                        className="text-[11px] text-blue-400 hover:text-blue-300"
                      >
                        Retry
                      </button>
                    )}
                  </div>
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
              startTyping();
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

      {/* Safety Layer: UndoToast */}
      <UndoToast
        show={undoToast.show}
        message={undoToast.message}
        onUndo={undoToast.handleUndo}
        onExpire={undoToast.handleExpire}
      />

      {/* Status Modal for Completion/Cancellation */}
      {statusModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0F172A] border border-[#1F2937] rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {statusModal.status === "completed"
                ? "Complete Order"
                : "Cancel Order"}
            </h3>
            <p className="text-sm text-[#9CA3AF]">
              {statusModal.status === "completed"
                ? "Please add a completion note describing the deliverable or outcome:"
                : "Please provide a reason for cancelling this order:"}
            </p>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm text-white placeholder:text-[#64748B] min-h-[100px]"
              placeholder={
                statusModal.status === "completed"
                  ? "e.g., Deliverables sent via chat. Logo files provided."
                  : "e.g., Client requested refund. Payment not received."
              }
              value={statusModal.inputValue}
              onChange={(e) =>
                setStatusModal((prev) => ({
                  ...prev,
                  inputValue: e.target.value,
                }))
              }
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() =>
                  setStatusModal({ open: false, status: "", inputValue: "" })
                }
                className="px-4 py-2 rounded-lg border border-white/10 text-[#9CA3AF] text-sm hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusModalConfirm}
                className={`px-4 py-2 rounded-lg text-white text-sm ${statusModal.status === "completed" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {statusModal.status === "completed"
                  ? "Complete Order"
                  : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
