"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

export default function PaymentPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const loadOrder = async () => {
    const data = await apiRequest(`/api/orders/${orderId}`, "GET", null, true);
    setOrder(data);
  };

  useEffect(() => {
    loadOrder();
    apiRequest("/api/payments", "GET").then(setMethods);
  }, [orderId]);

  const status: string | undefined = order?.status;
  const isExpired =
    status === "payment_pending" &&
    order?.expiresAt &&
    new Date(order.expiresAt).getTime() < Date.now();

  const canSubmit =
    (status === "payment_pending" || status === "rejected") && !isExpired;
  const isSubmitted = status === "payment_submitted";

  const submitProof = async () => {
    if (!canSubmit) return;
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

      toast("Payment submitted. Await verification.", "success");
      setFile(null);
      await loadOrder();
    } catch (e: any) {
      toast(e.message || "Failed to submit proof", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!order) return <p className="p-6">Loading…</p>;

  return (
    <div className="max-w-xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Complete Payment</h1>
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="text-sm text-blue-600 hover:underline"
        >
          View orders
        </button>
      </div>

      {isExpired && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          <p className="font-semibold">Reservation expired</p>
          <p className="text-sm opacity-90 mt-1">
            This order was reserved for 24 hours and has expired. Please buy the
            service again.
          </p>
          <button
            type="button"
            onClick={() => router.push("/buy-service")}
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-red-500/20 px-3 py-2 text-sm hover:bg-red-500/25"
          >
            Go to services
          </button>
        </div>
      )}

      {isSubmitted && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
          <p className="font-semibold">Payment submitted</p>
          <p className="text-sm opacity-90 mt-1">
            Payment submitted. Await verification.
          </p>
        </div>
      )}

      {status === "rejected" && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-orange-200">
          <p className="font-semibold">Payment rejected</p>
          <p className="text-sm opacity-90 mt-1">
            Your previous proof was rejected. Please submit a new proof.
          </p>
        </div>
      )}

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
            onClick={() => {
              if (canSubmit) setSelectedMethodId(m._id);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                if (canSubmit) setSelectedMethodId(m._id);
            }}
            aria-disabled={!canSubmit}
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
          disabled={!canSubmit}
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Upload Payment Proof</label>
        <input
          type="file"
          disabled={!canSubmit}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <button
        onClick={submitProof}
        disabled={loading || !canSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {status === "rejected" ? "Resubmit proof" : "Submit proof"}
      </button>

      <p className="text-xs text-slate-500">
        Payments are verified manually. Fake or reused proofs will result in
        rejection.
      </p>
    </div>
  );
}
