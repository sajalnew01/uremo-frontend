"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

interface Order {
  _id: string;
  status: string;
  serviceId: {
    title: string;
    price: number;
  };
  timeline: Array<{
    message: string;
    by: "system" | "admin";
    createdAt: string;
  }>;
}

export default function OrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = async () => {
    try {
      const data = await apiRequest(
        `/api/orders/${params.id}`,
        "GET",
        null,
        true
      );
      setOrder(data);
    } catch (err) {
      alert("Failed to load order");
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  if (loading) {
    return <div className="p-6">Loading order...</div>;
  }

  if (!order) {
    return <div className="p-6">Order not found</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <button
          onClick={() => router.push("/orders")}
          className="text-[#3B82F6] underline text-sm mb-4"
        >
          ← Back to Orders
        </button>
        <h1 className="text-3xl font-bold">Order Details</h1>
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
            <span className="inline-block px-3 py-1 rounded bg-[#1F2937] text-sm">
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="border border-[#1F2937] rounded-lg p-6 bg-[#0F172A]">
        <h3 className="font-semibold text-lg mb-4">Order Timeline</h3>

        <div className="space-y-3">
          {order.timeline && order.timeline.length > 0 ? (
            order.timeline.map((entry, idx) => (
              <div
                key={idx}
                className="text-sm border-l-2 border-[#1F2937] pl-3 pb-3"
              >
                <div className="flex justify-between items-start">
                  <p className="text-[#9CA3AF]">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  <span className="text-xs px-2 py-1 rounded bg-[#111827]">
                    {entry.by === "admin" ? "🔒 Admin" : "⚙️ System"}
                  </span>
                </div>
                <p className="mt-1 text-[#E5E7EB]">{entry.message}</p>
              </div>
            ))
          ) : (
            <p className="text-[#9CA3AF] text-sm">No timeline events yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
