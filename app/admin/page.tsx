"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import { apiRequest } from "@/lib/api";

export default function AdminPage() {
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

  return (
    <Container>
      <h1 className="text-xl font-semibold mb-4">Admin Orders</h1>

      {orders.length === 0 && <p>No orders found.</p>}

      {orders.map((order) => (
        <div key={order._id} className="border p-3 mb-3 rounded space-y-2">
          <p>
            <b>User:</b> {order.user?.email}
          </p>
          <p>
            <b>Service:</b> {order.service?.name || "N/A"}
          </p>
          <p>
            <b>Status:</b>{" "}
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
              {order.status}
            </span>
          </p>
          <p>
            <b>Payment Method:</b> {order.paymentMethod || "Not submitted"}
          </p>
          {order.transactionRef && (
            <p>
              <b>Transaction Ref:</b> {order.transactionRef}
            </p>
          )}

          {order.paymentProof && (
            <a
              href={order.paymentProof}
              target="_blank"
              className="underline text-blue-500"
            >
              View Payment Proof →
            </a>
          )}
        </div>
      ))}
    </Container>
  );
}
