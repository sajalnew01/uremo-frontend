"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import InlineError from "@/components/ui/InlineError";

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
    submittedAt?: string;
  };
};

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const loadOrder = async () => {
    const data = await apiRequest(`/api/orders/${orderId}`, "GET", null, true);
    setOrder(data);
  };

  const loadMessages = async () => {
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
  };

  useEffect(() => {
    loadOrder().catch(() => null);
    loadMessages().catch(() => null);
  }, [orderId]);

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
    await apiRequest(`/api/admin/orders/${order._id}`, "PUT", { status }, true);
    await loadOrder();
  };

  const sendReply = async () => {
    const text = reply.trim();
    if (!text) return;

    setSending(true);
    setSendError(null);
    try {
      await apiRequest(
        `/api/orders/${orderId}/messages`,
        "POST",
        { message: text },
        true
      );
      setReply("");
      await loadMessages();
    } catch (e: any) {
      const msg = e?.message || "Failed to send reply";
      setSendError(msg);
      toast(msg, "error");
    } finally {
      setSending(false);
    }
  };

  if (!order) {
    return <div className="p-6 text-sm text-[#9CA3AF]">Loading…</div>;
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
              <a
                href={order.payment.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 text-sm rounded bg-white/5 border border-white/10 text-white hover:bg-white/10"
              >
                View proof
              </a>
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
          <button
            type="button"
            onClick={() => loadMessages().catch(() => null)}
            className="text-sm text-[#9CA3AF] hover:text-white"
          >
            Refresh
          </button>
        </div>

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
                      ? "bg-blue-600/20 border-blue-500/30 text-white"
                      : "bg-white/5 border-white/10 text-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.message}</p>
                  <p className="mt-1 text-[11px] text-[#9CA3AF]">
                    {new Date(m.createdAt).toLocaleString()} — {m.senderRole}
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
              if (e.key === "Enter") sendReply();
            }}
            disabled={sending}
          />
          <button
            type="button"
            onClick={sendReply}
            disabled={sending || !reply.trim()}
            className="px-4 py-2 rounded-lg bg-[#3B82F6] text-white text-sm disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </Card>
    </div>
  );
}
