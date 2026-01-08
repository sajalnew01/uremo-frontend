"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface Order {
  _id: string;
  status: string;
  serviceId?: {
    title: string;
    price: number;
    currency: string;
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
  name: string;
  type: string;
  details: string;
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
  const [selectedMethod, setSelectedMethod] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const loadOrder = async () => {
    try {
      const [orderData, methodsData] = await Promise.all([
        apiRequest(`/api/orders/${params.orderId}`, "GET", null, true),
        apiRequest("/api/payments", "GET", null, false),
      ]);
      setOrder(orderData);
      setMethods(methodsData);
      if (methodsData.length > 0) setSelectedMethod(methodsData[0]._id);
    } catch (err) {
      console.error(err);
      alert("Failed to load order");
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  };

  const uploadProof = async () => {
    if (!proof) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", proof);

    try {
      const res = await apiRequest("/api/upload", "POST", formData, true, true);
      setProofUrl(res.url);
    } catch (err) {
      alert("Failed to upload proof");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMethod || !proofUrl) {
      alert("Payment method and proof are required");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(
        `/api/orders/${params.orderId}/payment`,
        "POST",
        {
          paymentMethod: selectedMethod,
          paymentProof: proofUrl,
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

  useEffect(() => {
    loadOrder();
  }, []);

  useEffect(() => {
    if (proof) uploadProof();
  }, [proof]);

  if (loading) {
    return <div className="p-6">Loading order details...</div>;
  }

  if (!order) {
    return <div className="p-6">Order not found</div>;
  }

  if (order.status === "payment_submitted") {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Payment Already Submitted</h1>
        <Card>
          <p className="text-sm text-gray-600 mb-4">
            This order's payment has already been submitted for verification.
          </p>
          <p className="text-sm mb-4">
            <strong>Status:</strong> {order.status}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Our team will review your submission shortly. Check back on the
            Orders page for updates.
          </p>
          <button
            onClick={() => router.push("/orders")}
            className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
        <p className="text-gray-600">
          All payments are manually verified by the UREMO team.
        </p>
      </div>

      {/* Order Info */}
      <Card title="Order Details">
        <div className="space-y-2">
          <p>
            <strong>Order ID:</strong> {order._id}
          </p>
          <p>
            <strong>Service:</strong> {order.serviceId?.title || "Unknown"}
          </p>
          <p>
            <strong>Amount:</strong> ${order.serviceId?.price || "0"}{" "}
            {order.serviceId?.currency || "USD"}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
              {order.status}
            </span>
          </p>
        </div>
      </Card>

      {/* Payment Methods */}
      <Card title="Select Payment Method">
        {methods.length === 0 ? (
          <p className="text-gray-600">
            No payment methods available. Please contact support.
          </p>
        ) : (
          <div className="space-y-4">
            {methods.map((m) => (
              <div
                key={m._id}
                className={`border rounded p-4 cursor-pointer ${
                  selectedMethod === m._id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300"
                }`}
                onClick={() => setSelectedMethod(m._id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{m.name}</h3>
                    <p className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
                      {m.type}
                    </p>
                    <p className="text-sm font-mono mt-2">{m.details}</p>
                    {m.instructions && (
                      <p className="text-sm text-gray-700 mt-2">
                        {m.instructions}
                      </p>
                    )}
                  </div>
                  <input
                    type="radio"
                    checked={selectedMethod === m._id}
                    onChange={() => setSelectedMethod(m._id)}
                    className="w-5 h-5"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Proof Upload */}
      <Card title="Upload Payment Proof">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              Payment Proof (Screenshot/Receipt)
            </label>
            <input
              type="file"
              accept="image/*"
              className="border rounded px-3 py-2 w-full"
              onChange={(e) => setProof(e.target.files?.[0] || null)}
            />
            {proof && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {proof.name}
              </p>
            )}
          </div>

          {uploading && <p className="text-blue-600">Uploading...</p>}

          {proofUrl && (
            <div>
              <p className="text-green-600 mb-2">✓ Proof uploaded</p>
              <img
                src={proofUrl}
                alt="Payment proof"
                className="w-64 border rounded"
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedMethod || !proofUrl}
            className="w-full px-4 py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit for Verification"}
          </button>
        </div>
      </Card>

      {/* Info */}
      <Card>
        <p className="text-sm text-gray-600">
          ⚠️ UREMO is an independent service provider. Payments are reviewed
          manually. We are not affiliated with any third-party payment platform.
          You will receive an email confirmation once payment is verified.
        </p>
      </Card>
    </div>
  );
}
