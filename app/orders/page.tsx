"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  useSiteSettings,
} from "@/hooks/useSiteSettings";

export default function OrdersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: settings } = useSiteSettings();
  const copy =
    settings?.orders?.list || DEFAULT_PUBLIC_SITE_SETTINGS.orders.list;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setError(null);
    try {
      const data = await apiRequest("/api/orders/my", "GET", null, true);
      setOrders(data);
    } catch (err: any) {
      const msg = err?.message || "Failed to load orders";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const statusBadge = (status: string) => {
    const base = "u-pill font-medium";
    const map: Record<string, string> = {
      pending: "border-slate-500/25 bg-slate-500/10 text-slate-200",
      payment_pending: "border-blue-500/25 bg-blue-500/10 text-blue-200",
      payment_submitted:
        "border-yellow-500/25 bg-yellow-500/10 text-yellow-200",
      review: "border-amber-500/25 bg-amber-500/10 text-amber-200",
      pending_review: "border-amber-500/25 bg-amber-500/10 text-amber-200",
      processing: "border-purple-500/25 bg-purple-500/10 text-purple-200",
      assistance_required:
        "border-orange-500/25 bg-orange-500/10 text-orange-200",
      approved: "border-teal-500/25 bg-teal-500/10 text-teal-200",
      completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
      rejected: "border-red-500/25 bg-red-500/10 text-red-200",
    };
    return `${base} ${
      map[status] || "border-white/10 bg-white/5 text-slate-200"
    }`;
  };

  const pendingPayment = orders.filter((o) => o.status === "payment_pending");
  const inProgressOrDone = orders.filter((o) => o.status !== "payment_pending");

  const OrderCard = ({ o }: { o: any }) => {
    const lastStatus =
      Array.isArray(o.statusLog) && o.statusLog.length > 0
        ? o.statusLog[o.statusLog.length - 1]
        : null;
    const lastTimeline =
      Array.isArray(o.timeline) && o.timeline.length > 0
        ? o.timeline[o.timeline.length - 1]
        : null;

    const previewText =
      lastStatus?.text || lastTimeline?.message || copy.noUpdatesText;

    // Check if last message was from admin (unread indicator)
    const lastMessage = o.lastMessage;
    const hasUnread = lastMessage?.senderRole === "admin";

    return (
      <div className="card">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg text-white truncate">
              {o.serviceId?.title || "Service"}
            </h3>
            <p className="text-xs text-[#9CA3AF] mt-1 font-mono truncate">
              {o._id}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasUnread && (
              <span className="px-2 py-1 rounded-full text-[10px] font-semibold border border-blue-500/30 bg-blue-500/20 text-blue-200 animate-pulse">
                New reply
              </span>
            )}
            <span className={statusBadge(o.status)}>
              {String(o.status).replace(/_/g, " ")}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
          <p className="text-xs text-[#9CA3AF]">{copy.latestUpdateLabel}</p>
          <p className="text-sm text-slate-200 mt-1 line-clamp-2">
            {previewText}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
          <div className="text-sm text-slate-300">
            <span className="text-emerald-300 font-semibold">
              ${o.serviceId?.price ?? "—"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
            {o.status === "payment_pending" && (
              <button
                onClick={() => router.push(`/payment/${o._id}`)}
                className="btn-primary w-full sm:w-auto"
              >
                {copy.completePaymentText}
              </button>
            )}

            {o.status === "rejected" && (
              <button
                onClick={() => router.push(`/payment/${o._id}`)}
                className="btn-primary w-full sm:w-auto"
              >
                {copy.resubmitProofText}
              </button>
            )}

            <button
              onClick={() => router.push(`/orders/${o._id}`)}
              className="btn-secondary w-full sm:w-auto"
            >
              {copy.viewDetailsText}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/orders/${o._id}?chat=1`)}
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-200 hover:bg-white/10 w-full sm:w-auto"
            >
              {copy.openChatText} →
            </button>
          </div>
        </div>

        {o.status === "payment_pending" && o.expiresAt && (
          <p className="mt-3 text-xs text-[#9CA3AF]">
            {copy.expiresPrefix} {new Date(o.expiresAt).toLocaleString()}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="u-container">
      <h1 className="text-3xl font-bold mb-2">{copy.title}</h1>
      <p className="text-slate-400 mb-8">{copy.subtitle}</p>

      {loading && <p className="text-sm text-[#9CA3AF]">{copy.loadingText}</p>}

      {!loading && error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-200">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadOrders();
            }}
            className="mt-3 btn-secondary px-3 py-2 text-sm"
          >
            {copy.retryText}
          </button>
        </div>
      )}

      <div className="space-y-8">
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">
              {copy.pendingPaymentTitle}
            </h2>
            <p className="text-sm text-slate-500">
              {pendingPayment.length} order
              {pendingPayment.length === 1 ? "" : "s"}
            </p>
          </div>
          {pendingPayment.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm">
              {copy.pendingPaymentEmptyText}
            </p>
          ) : (
            <div className="space-y-4">
              {pendingPayment.map((o) => (
                <OrderCard key={o._id} o={o} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">{copy.inProgressTitle}</h2>
            <p className="text-sm text-slate-500">
              {inProgressOrDone.length} order
              {inProgressOrDone.length === 1 ? "" : "s"}
            </p>
          </div>
          {inProgressOrDone.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm">{copy.inProgressEmptyText}</p>
          ) : (
            <div className="space-y-4">
              {inProgressOrDone.map((o) => (
                <OrderCard key={o._id} o={o} />
              ))}
            </div>
          )}
        </section>
      </div>

      {!loading && orders.length === 0 && (
        <p className="text-[#9CA3AF] mt-6">{copy.noOrdersYetText}</p>
      )}
    </div>
  );
}
