"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const data = await apiRequest("/api/orders/my", "GET", null, true);
      setOrders(data);
    } catch {
      alert("Failed to load orders");
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
      completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
      processing: "border-purple-500/25 bg-purple-500/10 text-purple-200",
      payment_submitted:
        "border-yellow-500/25 bg-yellow-500/10 text-yellow-200",
      payment_pending: "border-blue-500/25 bg-blue-500/10 text-blue-200",
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
      lastStatus?.text || lastTimeline?.message || "No updates yet.";

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

          <span className={statusBadge(o.status)}>
            {String(o.status).replace(/_/g, " ")}
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3">
          <p className="text-xs text-[#9CA3AF]">Latest update</p>
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

          <div className="flex gap-2">
            {o.status === "payment_pending" && (
              <button
                onClick={() => router.push(`/payment/${o._id}`)}
                className="btn-primary"
              >
                Complete payment
              </button>
            )}

            {o.status === "rejected" && (
              <button
                onClick={() => router.push(`/payment/${o._id}`)}
                className="btn-primary"
              >
                Resubmit proof
              </button>
            )}

            <button
              onClick={() => router.push(`/orders/${o._id}`)}
              className="btn-secondary"
            >
              View details
            </button>
          </div>
        </div>

        {o.status === "payment_pending" && o.expiresAt && (
          <p className="mt-3 text-xs text-[#9CA3AF]">
            Expires: {new Date(o.expiresAt).toLocaleString()}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="u-container">
      <h1 className="text-3xl font-bold mb-2">My Orders</h1>
      <p className="text-slate-400 mb-8">
        Track payment, verification, and delivery status in one place.
      </p>

      {loading && <p className="text-sm text-[#9CA3AF]">Loading orders…</p>}

      <div className="space-y-8">
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Pending Payment</h2>
            <p className="text-sm text-slate-500">
              {pendingPayment.length} order
              {pendingPayment.length === 1 ? "" : "s"}
            </p>
          </div>
          {pendingPayment.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm">No pending payments.</p>
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
            <h2 className="text-lg font-semibold">
              Orders in progress / completed
            </h2>
            <p className="text-sm text-slate-500">
              {inProgressOrDone.length} order
              {inProgressOrDone.length === 1 ? "" : "s"}
            </p>
          </div>
          {inProgressOrDone.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm">No orders yet.</p>
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
        <p className="text-[#9CA3AF] mt-6">
          You haven't placed any orders yet.
        </p>
      )}
    </div>
  );
}
