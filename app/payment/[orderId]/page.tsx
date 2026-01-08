"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface Order {
  _id: string;
  status: string;
  paymentMethod?: string;
  transactionRef?: string;
  paymentProof?: string;
  serviceId?: {
    name: string;
    price: number;
  };
}

export default function OrderPaymentPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [proof, setProof] = useState<File | null>(null);

  const loadOrder = async () => {
    try {
      const data = await apiRequest(
        `/api/orders/${params.orderId}`,
        "GET",
        null,
        true
      );
      setOrder(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load order");
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!method || !proof) {
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
          paymentMethod: method,
          transactionRef: reference,
          paymentProof: uploadRes.url,
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="PayPal">
          <p className="text-sm text-[#9CA3AF] mb-3">Send payment to:</p>
          <p className="font-semibold text-sm mb-4">payments@uremo.online</p>
          <button
            onClick={() => setMethod("paypal")}
            className={`w-full py-2 rounded text-sm ${
              method === "paypal"
                ? "bg-[#3B82F6] text-white"
                : "border border-[#1F2937]"
            }`}
          >
            {method === "paypal" ? "✓ Selected" : "Select PayPal"}
          </button>
        </Card>

        <Card title="Binance">
          <p className="text-sm text-[#9CA3AF] mb-3">Binance Pay ID:</p>
          <p className="font-semibold text-sm mb-4">UREMO_BINANCE_ID</p>
          <button
            onClick={() => setMethod("binance")}
            className={`w-full py-2 rounded text-sm ${
              method === "binance"
                ? "bg-[#3B82F6] text-white"
                : "border border-[#1F2937]"
            }`}
          >
            {method === "binance" ? "✓ Selected" : "Select Binance"}
          </button>
        </Card>

        <Card title="USDT (Crypto)">
          <p className="text-sm text-[#9CA3AF] mb-3">Network: TRC20</p>
          <p className="font-semibold text-xs mb-4 break-all">
            YOUR_USDT_WALLET_ADDRESS
          </p>
          <button
            onClick={() => setMethod("usdt")}
            className={`w-full py-2 rounded text-sm ${
              method === "usdt"
                ? "bg-[#3B82F6] text-white"
                : "border border-[#1F2937]"
            }`}
          >
            {method === "usdt" ? "✓ Selected" : "Select USDT"}
          </button>
        </Card>
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
            disabled={submitting || !method || !proof}
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
