"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export default function Admin() {
  const [orders, setOrders] = useState<any[]>([]);

  const loadOrders = async () => {
    try {
      const data = await apiRequest(
        "/api/admin/orders",
        "GET",
        undefined,
        true
      );
      setOrders(data);
    } catch (err: any) {
      alert(err.message || "Failed to load orders");
    }
  };
"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import { apiRequest } from "@/lib/api";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);

  const loadOrders = async () => {
    const data = await apiRequest("/api/admin/orders", "GET", null, true);
    setOrders(data);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await apiRequest(`/api/admin/orders/${id}`, "PUT", { status }, true);
    loadOrders();
  };

  return (
    <Container>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="overflow-x-auto">
        <table className="w-full border border-zinc-800">
          <thead className="bg-zinc-900">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Service</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Payment</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-t border-zinc-800">
                <td className="p-3">{o.userId?.email}</td>
                <td className="p-3">{o.serviceId?.name}</td>
                <td className="p-3">
                  <span className="px-2 py-1 text-xs rounded bg-zinc-800">
                    {o.status}
                  </span>
                </td>
                <td className="p-3">
                  {o.paymentProof ? (
                    <a
                      href={o.paymentProof}
                      target="_blank"
                      className="text-blue-400"
                    >
                      View Proof
                    </a>
                  ) : (
                    "Not uploaded"
                  )}
                </td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => updateStatus(o._id, "approved")}
                    className="bg-green-600 px-3 py-1 rounded text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(o._id, "rejected")}
                    className="bg-red-600 px-3 py-1 rounded text-sm"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
