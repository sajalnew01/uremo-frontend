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
    const base = "px-3 py-1 rounded-full text-xs font-medium";
    if (status === "completed") return `${base} bg-green-100 text-green-700`;
    if (status === "processing") return `${base} bg-blue-100 text-blue-700`;
    if (status === "pending_review")
      return `${base} bg-yellow-100 text-yellow-700`;
    if (status === "assistance_required")
      return `${base} bg-indigo-100 text-indigo-700`;
    if (status === "payment_pending")
      return `${base} bg-orange-100 text-orange-700`;
    if (status === "rejected") return `${base} bg-red-100 text-red-700`;
    return `${base} bg-slate-100 text-slate-600`;
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {loading && <p>Loading orders…</p>}

      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o._id} className="border rounded-xl p-5 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">
                  {o.serviceId?.title || "Service"}
                </h3>
                <p className="text-sm text-slate-500">Order ID: {o._id}</p>
              </div>

              <span className={statusBadge(o.status)}>
                {o.status.replace("_", " ")}
              </span>
            </div>

            {/* TIMELINE */}
            {o.timeline && o.timeline.length > 0 && (
              <div className="mt-4 border-t pt-3 text-sm">
                <h4 className="font-medium mb-2">Timeline</h4>
                {o.timeline.map((t: any, i: number) => (
                  <div key={i} className="text-slate-600 mb-1">
                    <span className="text-slate-400">
                      {new Date(t.createdAt).toLocaleString()}
                    </span>
                    {" — "}
                    {t.message}
                  </div>
                ))}
              </div>
            )}

            {/* ACTION */}
            {o.status === "payment_pending" && (
              <div className="mt-4">
                <button
                  onClick={() => router.push(`/payment/${o._id}`)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Complete Payment
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!loading && orders.length === 0 && (
        <p className="text-slate-500 mt-6">
          You haven't placed any orders yet.
        </p>
      )}
    </div>
  );
}
