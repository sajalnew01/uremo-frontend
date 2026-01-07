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
              <strong>Status:</strong> {order.status}
            </p>
          </div>
        ))}
      </div>
    </Container>
  );
}
