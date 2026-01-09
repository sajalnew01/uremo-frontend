"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function PaymentPage() {
  const { orderId } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest(`/api/orders/${orderId}`, "GET", null, true).then(setOrder);
    apiRequest("/api/payments", "GET").then(setMethods);
  }, [orderId]);

  const submitProof = async () => {
    if (!selectedMethodId) return alert("Please select a payment method");
    if (!file) return alert("Please upload payment proof");

    const form = new FormData();
    form.append("file", file);

    setLoading(true);
    try {
      const uploadRes = await apiRequest(
        "/api/upload/payment-proof",
        "POST",
        form,
        true,
        true
      );

      await apiRequest(
        `/api/orders/${orderId}/payment`,
        "PUT",
        {
          methodId: selectedMethodId,
          reference,
          proofUrl: uploadRes.url,
        },
        true
      );
      router.push("/orders");
    } catch (e: any) {
      alert(e.message || "Failed to submit proof");
    } finally {
      setLoading(false);
    }
  };

  if (!order) return <p className="p-6">Loading…</p>;

  return (
    <div className="max-w-xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-bold">Complete Payment</h1>

      <div className="border rounded p-4">
        <p className="font-semibold">{order.serviceId?.title}</p>
        <p className="text-slate-600">Amount: ${order.serviceId?.price}</p>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Payment Methods</h3>

        {methods.length === 0 && (
          <p className="text-slate-500 text-sm">No payment methods yet.</p>
        )}

        {methods.map((m) => (
          <div
            key={m._id}
            className={`border rounded p-3 cursor-pointer transition ${
              selectedMethodId === m._id
                ? "border-blue-500 bg-blue-50/20"
                : "hover:border-slate-300"
            }`}
            onClick={() => setSelectedMethodId(m._id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                setSelectedMethodId(m._id);
            }}
          >
            <p className="font-semibold">{m.name}</p>
            <p className="text-sm">{m.details}</p>
            {m.instructions && (
              <p className="text-xs text-slate-500 mt-1">{m.instructions}</p>
            )}
          </div>
        ))}
      </div>

      <div>
        <label className="block mb-2 font-medium">Reference (optional)</label>
        <input
          className="w-full border rounded p-2"
          placeholder="Transaction ID / note you used"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Upload Payment Proof</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <button
        onClick={submitProof}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Submit Proof
      </button>

      <p className="text-xs text-slate-500">
        Payments are verified manually. Fake or reused proofs will result in
        rejection.
      </p>
    </div>
  );
}
