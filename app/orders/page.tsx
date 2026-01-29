"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  useSiteSettings,
} from "@/hooks/useSiteSettings";
import EmptyState from "@/components/ui/EmptyState";

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
      in_progress: "border-purple-500/25 bg-purple-500/10 text-purple-200",
      waiting_user: "border-amber-500/25 bg-amber-500/10 text-amber-200",
      completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
      cancelled: "border-red-500/25 bg-red-500/10 text-red-200",
    };
    return `${base} ${
      map[status] || "border-white/10 bg-white/5 text-slate-200"
    }`;
  };

  const pendingOrWaiting = orders.filter(
    (o) => o.status === "pending" || o.status === "waiting_user",
  );
  const inProgressOrDone = orders.filter(
    (o) => o.status !== "pending" && o.status !== "waiting_user",
  );

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

    // Status icon map
    const statusIcon: Record<string, string> = {
      pending: "⏳",
      in_progress: "⚡",
      waiting_user: "🔍",
      completed: "🎉",
      cancelled: "❌",
    };

    return (
      <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-sm hover:border-white/20 transition-all duration-300">
        {/* Status indicator stripe */}
        <div
          className={`absolute top-0 left-0 w-full h-1 ${
            o.status === "completed"
              ? "bg-emerald-500"
              : o.status === "in_progress"
                ? "bg-purple-500"
                : o.status === "pending"
                  ? "bg-slate-500"
                  : o.status === "cancelled"
                    ? "bg-red-500"
                    : o.status === "waiting_user"
                      ? "bg-amber-500"
                      : "bg-slate-600"
          }`}
        />

        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{statusIcon[o.status] || "📦"}</span>
                <h3 className="font-semibold text-lg text-white truncate">
                  {o.serviceId?.title || "Service"}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Order #{o._id?.slice(-8).toUpperCase()}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
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

          {/* Price & Date */}
          <div className="mt-4 flex items-center gap-4">
            <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 font-bold text-lg">
                ${o.serviceId?.price ?? "—"}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              <span>Created: </span>
              <span className="text-slate-400">
                {new Date(o.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Latest Update */}
          <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              {copy.latestUpdateLabel}
            </p>
            <p className="text-sm text-slate-300 mt-1 line-clamp-2">
              {previewText}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {o.status === "pending" && (
              <button
                onClick={() => router.push(`/payment/${o._id}`)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-sm hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/20"
              >
                💳 {copy.completePaymentText}
              </button>
            )}

            {o.status === "cancelled" && (
              <button
                onClick={() => router.push(`/payment/${o._id}`)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-medium text-sm hover:from-orange-500 hover:to-orange-400 transition-all"
              >
                🔄 {copy.resubmitProofText}
              </button>
            )}

            <button
              onClick={() => router.push(`/orders/${o._id}`)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-200 font-medium text-sm hover:bg-white/10 transition-all"
            >
              📋 {copy.viewDetailsText}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/orders/${o._id}?chat=1`)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-200 text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-1"
            >
              💬 {copy.openChatText}
            </button>
          </div>

          {o.status === "pending" && o.expiresAt && (
            <div className="mt-3 flex items-center gap-1 text-xs text-orange-400/80">
              <span>⏰</span>
              <span>
                {copy.expiresPrefix} {new Date(o.expiresAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
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
              {copy.pendingOrWaitingTitle}
            </h2>
            <p className="text-sm text-slate-500">
              {pendingOrWaiting.length} order
              {pendingOrWaiting.length === 1 ? "" : "s"}
            </p>
          </div>
          {pendingOrWaiting.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm">
              {copy.pendingOrWaitingEmptyText}
            </p>
          ) : (
            <div className="space-y-4">
              {pendingOrWaiting.map((o) => (
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
        <EmptyState
          icon="📦"
          title="You haven't availed any service yet"
          description="Browse our marketplace and find the perfect service to get started. We offer manual onboarding, verification, and more!"
          ctaText="Explore Services"
          ctaHref="/explore-services"
          secondaryCtaText="View Dashboard"
          secondaryCtaHref="/dashboard"
        />
      )}
    </div>
  );
}
