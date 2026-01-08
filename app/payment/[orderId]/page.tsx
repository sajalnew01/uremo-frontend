"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface Order {
  _id: string;
  status: string;
  serviceId?: {
    name: string;
    price: number;
  };
  payment?: {
    methodId?: string;
    reference?: string;
    proofUrl?: string;
    submittedAt?: string;
  };
}

interface PaymentMethod {
  _id: string;
  type: string;
  label: string;
  value: string;
  instructions: string;
  active: boolean;
}

export default function OrderPaymentPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [methodId, setMethodId] = useState("");
  const [reference, setReference] = useState("");
  const [proof, setProof] = useState<File | null>(null);

  const loadOrder = async () => {
    try {
      const [orderData, methodsData] = await Promise.all([
        apiRequest(`/api/orders/${params.orderId}`, "GET", null, true),
        apiRequest("/api/payment-methods", "GET", null, false),
      ]);
      setOrder(orderData);
      setMethods(methodsData.methods || methodsData);
    } catch (err) {
      console.error(err);
      alert("Failed to load order");
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!methodId || !proof) {
      alert("Payment method and proof are required");
      return;
    }

    // Upload proof to Cloudinary first
    const fd = new FormData();
    fd.append("file", proof);

    setSubmitting(true);
    try {
      // Upload proof
      const uploadRes = await apiRequest(
        "/api/upload/payment-proof",
        "POST",
        fd,
        true,
        true
      );

      // Submit payment with proof URL
      await apiRequest(
        `/api/orders/${params.orderId}/payment`,
        "PUT",
        {
          methodId,
          reference,
          proofUrl: uploadRes.url,
        },
        true
      );

      alert("Payment submitted for verification");
      router.push("/orders");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading order details...</div>;
  }

  if (!order) {
    return <div className="p-6">Order not found</div>;
  }

  if (order.status === "payment_submitted") {
    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">Payment Already Submitted</h1>
        <Card>
          <p className="text-sm text-[#9CA3AF] mb-4">
            This order's payment has already been submitted for verification.
          </p>
          <p className="text-sm mb-4">
            <strong>Status:</strong> {order.status}
          </p>
          <p className="text-sm text-[#9CA3AF] mb-4">
            Our team will review your submission shortly. Check back on the
            Orders page for updates.
          </p>
          <button
            onClick={() => router.push("/orders")}
            className="px-4 py-2 bg-[#3B82F6] rounded text-white"
          >
            Back to Orders
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Complete Payment</h1>
        <p className="text-[#9CA3AF]">
          All payments are manually verified by the UREMO team.
        </p>
      </div>

      {/* Order Info */}
      <Card title="Order Details">
        <div className="space-y-2 text-sm">
          <p>
            <strong>Order ID:</strong> {order._id}
          </p>
          <p>
            <strong>Service:</strong> {order.serviceId?.name}
          </p>
          <p>
            <strong>Amount:</strong> ${order.serviceId?.price}
          </p>
        </div>
      </Card>

      {/* Payment Methods */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Select Payment Method</h2>
        {methods.length === 0 ? (
          <Card>
            <p className="text-sm text-[#9CA3AF]">
              No payment methods available. Please contact support.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {methods.map((m) => (
              <Card key={m._id}>
                <div>
                  <p className="font-semibold text-sm mb-1">{m.label}</p>
                  <p className="text-xs text-[#9CA3AF] mb-3">{m.type}</p>
                  <p className="text-xs text-[#9CA3AF] mb-2">
                    {m.instructions}
                  </p>
                  <p className="text-xs font-mono bg-[#111827] p-2 rounded mb-3 break-all">
                    {m.value}
                  </p>
                  <button
                    onClick={() => setMethodId(m._id)}
                    className={`w-full py-2 rounded text-sm ${
                      methodId === m._id
                        ? "bg-[#3B82F6] text-white"
                        : "border border-[#1F2937]"
                    }`}
                  >
                    {methodId === m._id ? "✓ Selected" : "Select"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Proof Upload */}
      <Card title="Upload Payment Proof">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#9CA3AF] block mb-2">
              Transaction Reference (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., txn_12345, wallet address, email"
              className="w-full p-2 bg-transparent border border-[#1F2937] rounded text-sm"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-[#9CA3AF] block mb-2">
              Payment Proof (Screenshot/Receipt)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="text-sm"
              onChange={(e) => setProof(e.target.files?.[0] || null)}
            />
            {proof && (
              <p className="text-xs text-[#9CA3AF] mt-1">
                Selected: {proof.name}
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !methodId || !proof}
            className="w-full px-4 py-3 rounded bg-[#22C55E] text-black font-semibold hover:bg-green-500 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit for Verification"}
          </button>
        </div>
      </Card>

      {/* Info */}
      <Card>
        <p className="text-xs text-[#9CA3AF]">
          ⚠️ UREMO is an independent service provider. Payments are reviewed
          manually. We are not affiliated with any third-party payment platform.
          You will receive an email confirmation once payment is verified.
        </p>
      </Card>
    </div>
  );
}
