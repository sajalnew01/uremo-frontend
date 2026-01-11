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

  const step = isSubmitted ? 3 : 2;
  const hasMethod = Boolean(selectedMethodId);
  const hasProof = Boolean(file);

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
    <div className="u-container max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Payment</h1>
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="text-sm text-[#9CA3AF] hover:text-white transition"
        >
          View orders
        </button>
      </div>

      {/* Wizard */}
      <div className="card">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {[1, 2, 3].map((n) => {
            const done = (isSubmitted && n <= 3) || (!isSubmitted && n < step);
            const active = n === step;
            return (
              <div key={n} className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border ${
                    done
                      ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-200"
                      : active
                      ? "bg-blue-500/15 border-blue-500/25 text-blue-200"
                      : "bg-white/5 border-white/10 text-[#9CA3AF]"
                  }`}
                >
                  {n}
                </div>
                <div className="text-sm">
                  <p className="text-white font-medium">
                    {n === 1
                      ? "Select method"
                      : n === 2
                      ? "Upload proof"
                      : "Submitted"}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {n === 1
                      ? "Choose where you paid"
                      : n === 2
                      ? "Attach receipt/screenshot"
                      : "Await verification"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 h-px bg-white/10" />

        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-slate-300">
            <span className="text-[#9CA3AF]">Service:</span>{" "}
            {order.serviceId?.title}
          </p>
          <p className="text-emerald-300 font-semibold">
            ${order.serviceId?.price}
          </p>
        </div>
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
            className={`rounded-xl border p-4 cursor-pointer transition ${
              selectedMethodId === m._id
                ? "border-blue-500/40 bg-blue-500/10"
                : "border-white/10 hover:border-white/20 bg-white/5"
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
            <p className="text-sm text-slate-200 mt-1">{m.details}</p>
            {m.instructions && (
              <p className="text-xs text-[#9CA3AF] mt-2">{m.instructions}</p>
            )}
          </div>
        ))}
      </div>

      <div>
        <label className="block mb-2 font-medium">Reference (optional)</label>
        <input
          className="u-input"
          placeholder="Transaction ID / note you used"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          disabled={!canSubmit}
        />
      </div>

      <div>
        <label className="block mb-2 font-medium">Upload Payment Proof</label>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <input
            type="file"
            disabled={!canSubmit}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm text-slate-200"
          />
          <p className="mt-2 text-xs text-[#9CA3AF]">
            Tip: include amount + receiver details in the screenshot.
          </p>
        </div>
      </div>

      <button
        onClick={submitProof}
        disabled={loading || !canSubmit}
        className="btn-primary disabled:opacity-50 w-full"
      >
        {isSubmitted
          ? "Submitted"
          : status === "rejected"
          ? "Resubmit proof"
          : "Submit proof"}
      </button>

      {!isSubmitted && canSubmit && (
        <p className="text-xs text-[#9CA3AF]">
          Status: {hasMethod ? "method selected" : "select a method"}
          {" · "}
          {hasProof ? "proof attached" : "attach proof"}
        </p>
      )}

      <p className="text-xs text-[#9CA3AF]">
        Payments are verified manually. Fake or reused proofs will result in
        rejection.
      </p>
    </div>
  );
}
