"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import { apiRequest } from "@/lib/api";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    apiRequest("/api/orders", "GET", undefined, true).then((res) =>
      setOrders(res)
    );
  }, []);

  return (
    <Container>
      <h1 className="text-2xl font-semibold mb-6">My Orders</h1>

      {orders.length === 0 && <p>No orders yet.</p>}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="border border-zinc-800 p-4 rounded">
            <p>
              <strong>Service:</strong> {order.service?.name}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={
                  order.status === "pending"
                    ? "text-gray-400"
                    : order.status === "payment_submitted"
                    ? "text-yellow-500"
                    : order.status === "approved"
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {order.status === "pending" && "⏳ Pending payment"}
                {order.status === "payment_submitted" &&
                  "🔍 Under verification"}
                {order.status === "approved" && "✅ Approved"}
                {order.status === "rejected" && "❌ Rejected"}
              </span>
            </p>

            {order.status === "pending" && (
              <a
                href="/payment"
                className="text-blue-500 underline text-sm mt-2 inline-block"
              >
                Proceed to payment →
              </a>
            )}
          </div>
        ))}
      </div>
    </Container>
  );
}
