"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import FilePreview from "@/components/FilePreview";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

type Order = {
  _id: string;
  status: string;
  isRejectedArchive?: boolean;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
  userId?: { email: string };
  serviceId?: { title: string; price?: number };
  payment?: {
    proofUrl?: string;
    submittedAt?: string;
    reference?: string;
  };
};

export default function AdminCancelledOrdersPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Order[]>(
        "/api/admin/orders/cancelled",
        "GET",
        null,
        true,
      );
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast(err?.message || "Failed to load cancelled orders", "error");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unarchive = async (id: string) => {
    try {
      await apiRequest(
        `/api/admin/orders/${id}/unarchive-cancelled`,
        "PUT",
        {},
        true,
      );
      toast("Order unarchived", "success");
      setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch (err: any) {
      toast(err?.message || "Failed to unarchive", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Admin — Cancelled Orders</h1>
          <p className="text-sm text-slate-400 mt-1">
            Archived cancelled orders live here. They are not deleted.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="btn-secondary px-3 py-2 text-sm"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <Card>
        {loading ? (
          <p className="text-sm text-[#9CA3AF]">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">
            No archived cancelled orders.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="text-left sticky top-0 bg-[#0B1220]/90 backdrop-blur border-b border-white/10">
                  <th className="p-3 text-xs tracking-widest text-slate-300">
                    User
                  </th>
                  <th className="p-3 text-xs tracking-widest text-slate-300">
                    Service
                  </th>
                  <th className="p-3 text-xs tracking-widest text-slate-300">
                    Cancelled At
                  </th>
                  <th className="p-3 text-xs tracking-widest text-slate-300">
                    Proof
                  </th>
                  <th className="p-3 text-xs tracking-widest text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr
                    key={o._id}
                    className={`border-b border-white/10 hover:bg-white/5 transition ${
                      idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                    }`}
                  >
                    <td className="p-3 text-slate-200">
                      {o.userId?.email || "—"}
                    </td>
                    <td className="p-3 text-slate-200">
                      {o.serviceId?.title || "—"}
                    </td>
                    <td className="p-3 text-slate-300">
                      {o.cancelledAt || o.rejectedAt
                        ? new Date(
                            o.cancelledAt || o.rejectedAt!,
                          ).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3">
                      {o.payment?.proofUrl ? (
                        <FilePreview
                          url={o.payment.proofUrl}
                          label="View proof"
                        />
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn-secondary px-3 py-1 text-xs"
                          onClick={() => router.push(`/admin/orders/${o._id}`)}
                        >
                          View details
                        </button>

                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                          onClick={() => unarchive(o._id)}
                        >
                          Unarchive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
