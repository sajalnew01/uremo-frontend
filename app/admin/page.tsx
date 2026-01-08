"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface Order {
  _id: string;
  status: string;
  paymentMethod?: string;
  transactionRef?: string;
  paymentProof?: string;
  user?: { email: string };
  serviceId?: { name: string };
}

const statusBadge = (status: string) => {
  const map: any = {
    pending: "bg-gray-600",
    payment_submitted: "bg-yellow-600",
    approved: "bg-green-600",
    rejected: "bg-red-600",
  };
  return map[status] || "bg-gray-600";
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  const load = async () => {
    const data = await apiRequest("/api/admin/orders", "GET", null, true);
    setOrders(data);
  };

  const update = async (id: string, status: string) => {
    await apiRequest(`/api/admin/orders/${id}`, "PUT", { status }, true);
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin — Orders</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1F2937] text-left">
                <th className="p-3">User</th>
                <th className="p-3">Service</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b border-[#1F2937]">
                  <td className="p-3">{o.user?.email}</td>
                  <td className="p-3">{o.serviceId?.name}</td>

                  <td className="p-3 space-y-1">
                    <div className="capitalize">{o.paymentMethod || "—"}</div>
                    {o.paymentProof && (
                      <a
                        href={o.paymentProof}
                        target="_blank"
                        className="text-[#3B82F6] text-xs"
                      >
                        View proof
                      </a>
                    )}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${statusBadge(
                        o.status
                      )}`}
                    >
                      {o.status.replace("_", " ")}
                    </span>
                  </td>

                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => update(o._id, "approved")}
                      className="px-3 py-1 bg-green-600 rounded text-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => update(o._id, "rejected")}
                      className="px-3 py-1 bg-red-600 rounded text-xs"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <p className="text-sm text-[#9CA3AF] mt-4">No orders found.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
