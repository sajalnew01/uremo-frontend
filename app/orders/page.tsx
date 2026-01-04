"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/orders/my", "GET", null, true)
      .then(setOrders)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-8">Loading orders…</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">My Orders</h1>

      {orders.length === 0 && <p>No orders yet.</p>}

      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o._id} className="border p-4 rounded">
            <h2 className="font-medium">{o.serviceId?.name || "Service"}</h2>
            <p className="text-sm text-gray-600">
              Status:{" "}
              <span className="font-semibold">{o.status.toUpperCase()}</span>
            </p>
            <p className="text-sm text-gray-400">Order ID: {o._id}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
