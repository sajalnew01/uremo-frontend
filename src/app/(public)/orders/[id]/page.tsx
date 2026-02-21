"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { useRequireAuth } from "@/hooks/useAuth";
import { useChatStream } from "@/hooks/useChatStream";
import { useAuthStore } from "@/store";
import { Badge, Timeline, ConfirmModal } from "@/design-system";
import { emitToast } from "@/hooks/useToast";
import type { Order, OrderMessage } from "@/types";

export default function OrderDetailPage() {
  const ready = useRequireAuth();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [message, setMessage] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery<{ order: Order }>({
    queryKey: ["order", id],
    queryFn: () => apiRequest(EP.ORDER_BY_ID(id), "GET", undefined, true),
    enabled: ready && !!id,
  });

  const { data: messagesData } = useQuery<{ messages: OrderMessage[] }>({
    queryKey: ["order-messages", id],
    queryFn: () => apiRequest(EP.ORDER_MESSAGES(id), "GET", undefined, true),
    enabled: ready && !!id,
  });

  // SSE stream for real-time messages
  const chatStream = useChatStream({
    orderId: id,
    onMessage: (msg) => {
      queryClient.setQueryData(["order-messages", id], (old: { messages: OrderMessage[] } | undefined) => {
        if (!old) return { messages: [msg] };
        const exists = old.messages.some((m) => m._id === msg._id);
        if (exists) return old;
        return { messages: [...old.messages, msg] };
      });
    },
    enabled: ready && !!id,
  });

  const allMessages = (() => {
    const base = messagesData?.messages || [];
    return [...base].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  })();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: () =>
      apiRequest(EP.ORDER_MESSAGES(id), "POST", { message }, true),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["order-messages", id] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  // Upload payment proof
  const proofMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("proof", proofFile!);
      return apiRequest(EP.UPLOAD_PAYMENT_PROOF_ORDER(id), "POST", fd, true, true);
    },
    onSuccess: () => {
      emitToast("Payment proof uploaded!", "success");
      setProofFile(null);
      setShowUploadConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate();
  };

  const order = data?.order;

  if (!ready) return null;

  if (isLoading) {
    return <div className="page-content"><div className="page-loading"><div className="u-spinner" /> Loading...</div></div>;
  }

  if (error || !order) {
    return <div className="page-content"><div className="page-empty">Order not found.</div></div>;
  }

  const svc = typeof order.serviceId === "object" ? order.serviceId : null;

  return (
    <div className="page-content">
      <div className="detail-grid">
        {/* Main */}
        <div>
          <h1 className="page-title">{svc?.title || "Order"}</h1>
          <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
            <Badge status={order.status} />
            <Badge status={order.paymentStatus} />
            <Badge status={order.orderType} />
          </div>

          {/* Chat */}
          <div className="page-section">
            <h3 className="u-heading-3" style={{ marginBottom: "var(--space-3)" }}>Messages</h3>
            <div className="chat-container">
              <div className="chat-messages">
                {allMessages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--color-text-tertiary)", padding: "var(--space-8) 0" }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  allMessages.map((msg, i) => {
                    const isUser = msg.senderId === user?._id;
                    return (
                      <div
                        key={msg._id || i}
                        className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-admin"}`}
                      >
                        <div>{msg.message}</div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div style={{ marginTop: "var(--space-2)" }}>
                            {msg.attachments.map((att, j) => (
                              <a key={j} href={att.url} target="_blank" rel="noreferrer" style={{ fontSize: "var(--text-xs)", color: isUser ? "rgba(255,255,255,0.8)" : "var(--color-brand)" }}>
                                📎 {att.filename || "Attachment"}
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="chat-bubble-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-bar" onSubmit={handleSendMessage}>
                <input
                  className="u-input"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className="u-btn u-btn-primary"
                  disabled={sendMutation.isPending || !message.trim()}
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <div className="page-section">
              <h3 className="u-heading-3" style={{ marginBottom: "var(--space-3)" }}>Timeline</h3>
              <Timeline
                entries={order.timeline.map((t) => ({
                  action: t.action,
                  at: t.at,
                  by: t.by,
                }))}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          <div className="u-card">
            <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-3)" }}>Order Details</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-tertiary)" }}>Order ID</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>{order._id.slice(-8)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-tertiary)" }}>Type</span>
                <span>{order.orderType}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-tertiary)" }}>Created</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              {order.payment?.paidAt && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-tertiary)" }}>Paid At</span>
                  <span>{new Date(order.payment.paidAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Proof Upload */}
          {order.paymentStatus === "unpaid" && (
            <div className="u-card">
              <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-3)" }}>Upload Payment Proof</h4>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-3)" }}
              />
              <button
                className="u-btn u-btn-primary u-btn-sm"
                disabled={!proofFile}
                onClick={() => setShowUploadConfirm(true)}
                style={{ width: "100%" }}
              >
                Upload Proof
              </button>
            </div>
          )}

          {order.payment?.proofUrl && (
            <div className="u-card">
              <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-3)" }}>Payment Proof</h4>
              <a href={order.payment.proofUrl} target="_blank" rel="noreferrer" className="u-btn u-btn-secondary u-btn-sm" style={{ width: "100%", textAlign: "center" }}>
                View Proof
              </a>
            </div>
          )}

          {order.notes && order.notes.length > 0 && (
            <div className="u-card">
              <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-3)" }}>Notes</h4>
              {order.notes.map((note, i) => (
                <p key={i} style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-2)" }}>{note}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showUploadConfirm}
        title="Upload Payment Proof"
        message={`Upload "${proofFile?.name}" as payment proof for this order?`}
        onConfirm={() => proofMutation.mutateAsync()}
        onCancel={() => setShowUploadConfirm(false)}
      />
    </div>
  );
}
