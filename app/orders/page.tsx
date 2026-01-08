"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface Order {
  _id: string;
  status: string;
  serviceId: {
    name: string;
  };
  paymentMethod?: string;
}

const statusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-gray-600";
    case "payment_submitted":
      return "bg-yellow-600";
    case "approved":
      return "bg-green-600";
    case "rejected":
      return "bg-red-600";
    default:
      return "bg-gray-600";
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-[#9CA3AF]">Track payments and verification status</p>
      </div>

      <Card>
        {loading && <p>Loading orders...</p>}

        {!loading && orders.length === 0 && (
          <p className="text-sm text-[#9CA3AF]">
            You haven't placed any orders yet.
          </p>
        )}

        {!loading && orders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#1F2937]">
                  <th className="p-3">Service</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-b border-[#1F2937]">
                    <td className="p-3">{o.serviceId?.name || "-"}</td>

                    <td className="p-3 capitalize">
                      {o.paymentMethod || "Not paid"}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${statusColor(
                          o.status
                        )}`}
                      >
                        {o.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="p-3">
                      {o.status === "payment_pending" && (
                        <button
                          onClick={() => router.push(`/payment/${o._id}`)}
                          className="text-[#3B82F6] hover:underline"
                        >
                          Proceed to payment →
                        </button>
                      )}

                      {o.status === "payment_submitted" && (
                        <span className="text-yellow-500">Under review</span>
                      )}

                      {o.status === "approved" && (
                        <span className="text-green-500">Completed
                        <span className="text-green-500">Processing</span>
                      )}

                      {o.status === "rejected" && (
                        <span className="text-red-500">Rejected</span>
                      )}
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
