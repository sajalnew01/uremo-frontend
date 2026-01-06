"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export default function Admin() {
  const [orders, setOrders] = useState<any[]>([]);

  const loadOrders = async () => {
    try {
      const data = await apiRequest("/api/admin/orders", "GET", null, true);
      setOrders(data);
    } catch (err: any) {
      alert(err.message || "Failed to load orders");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiRequest(`/api/admin/orders/${id}`, "PATCH", { status }, true);
      loadOrders();
    } catch (err: any) {
      alert(err.message || "Update failed");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Admin — Orders</h1>

      {orders.length === 0 && <p>No orders yet.</p>}

      <div className="space-y-4">
        {orders.map((o: any) => (
          <div key={o._id} className="border p-4 rounded">
            <p>
              <strong>User:</strong> {o.userId?.email}
            </p>
            <p>
              <strong>Service:</strong> {o.serviceId?.name}
            </p>
            <p>
              <strong>Price:</strong> ${o.serviceId?.price}
            </p>
            <p>
              <strong>Status:</strong> {o.status?.toUpperCase()}
            </p>

            {o.documents?.paymentProof && (
              <div className="mt-2 text-sm">
                <a
                  href={o.documents.paymentProof}
                  target="_blank"
                  className="underline mr-4"
                >
                  Payment Proof
                </a>
                <a
                  href={o.documents.senderKyc}
                  target="_blank"
                  className="underline"
                >
                  Sender KYC
                </a>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => updateStatus(o._id, "completed")}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus(o._id, "rejected")}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
