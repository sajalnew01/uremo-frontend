"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

export default function PaymentPage() {
  const { orderId } = useParams();
  const resolvedOrderId = Array.isArray(orderId) ? orderId[0] : orderId;
  const router = useRouter();
  const { toast } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const loadOrder = async () => {
    const data = await apiRequest(
      `/api/orders/${resolvedOrderId}`,
      "GET",
      null,
      true
    );
    setOrder(data);
  };

  useEffect(() => {
    loadOrder();
    apiRequest("/api/payments", "GET").then(setMethods);
  }, [resolvedOrderId]);

  const copy = async (value: string, what: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast(`${what} copied`, "success");
    } catch {
      toast("Copy failed", "error");
    }
  };

  const status: string | undefined = order?.status;
  const isExpired =
    status === "payment_pending" &&
    order?.expiresAt &&
    new Date(order.expiresAt).getTime() < Date.now();

  const canSubmit =
    (status === "payment_pending" || status === "rejected") && !isExpired;
  const isSubmitted = status === "payment_submitted";

  const hasMethod = Boolean(selectedMethodId);
  const hasProof = Boolean(file);
  const step = isSubmitted ? 3 : hasMethod ? 2 : 1;

  const submitProof = async () => {
    if (!canSubmit) return;
    if (!selectedMethodId) {
      toast("Please select a payment method", "error");
      return;
    }
    if (!file) {
      toast("Please upload payment proof", "error");
      return;
    }

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
        `/api/orders/${resolvedOrderId}/payment`,
        "PUT",
        {
          methodId: selectedMethodId,
          reference,
          proofUrl: uploadRes.url,
          proofPublicId: uploadRes.publicId,
          proofResourceType: uploadRes.resourceType,
          proofFormat: uploadRes.format,
        },
        true
      );

      toast("Proof submitted. Redirecting…", "success");
      setFile(null);
      router.push(`/orders/${resolvedOrderId}?chat=1`);
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
            const done = n < step;
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
                      : "Await verification"}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {n === 1
                      ? "Choose where you paid"
                      : n === 2
                      ? "Attach receipt/screenshot"
                      : "We verify payments manually"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 h-px bg-white/10" />

        <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-[#9CA3AF]">Order ID</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-slate-200 font-mono text-xs break-all">
                {String(resolvedOrderId || "")}
              </p>
              <button
                type="button"
                onClick={() => copy(String(resolvedOrderId || ""), "Order ID")}
                className="px-3 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white hover:bg-white/10"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-[#9CA3AF]">Payment summary</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-slate-200">{order.serviceId?.title}</p>
              <p className="text-emerald-300 font-semibold">
                ${order.serviceId?.price}
              </p>
            </div>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Make sure the amount matches your receipt.
            </p>
          </div>
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
        <div className="card border border-emerald-500/30 bg-emerald-500/10">
          <p className="font-semibold text-emerald-100">Payment submitted</p>
          <p className="text-sm text-emerald-200/90 mt-1">
            Your proof is in our queue. We'll verify it and update your order
            status.
          </p>
        </div>
      )}

      {status === "rejected" && (
        <div className="card border border-orange-500/30 bg-orange-500/10">
          <p className="font-semibold text-orange-100">Payment rejected</p>
          <p className="text-sm text-orange-200/90 mt-1">
            Your previous proof was rejected. Select a method and submit a new
            proof.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Methods */}
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Payment method</h3>
            {!canSubmit && (
              <span className="text-xs text-[#9CA3AF]">Locked</span>
            )}
          </div>

          <p className="mt-1 text-sm text-[#9CA3AF]">
            Select the exact method you used for this payment.
          </p>

          <div className="mt-4 space-y-3">
            {methods.length === 0 && (
              <p className="text-[#9CA3AF] text-sm">No payment methods yet.</p>
            )}

            {methods.map((m) => (
              <div
                key={m._id}
                className={`rounded-xl border p-4 cursor-pointer transition ${
                  selectedMethodId === m._id
                    ? "border-blue-500/40 bg-blue-500/10"
                    : "border-white/10 hover:border-white/20 bg-white/5"
                } ${!canSubmit ? "opacity-60 cursor-not-allowed" : ""}`}
                onClick={() => {
                  if (canSubmit) setSelectedMethodId(m._id);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (canSubmit) setSelectedMethodId(m._id);
                  }
                }}
                aria-disabled={!canSubmit}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm text-slate-200 mt-1 break-all">
                      {m.details}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copy(String(m.details || ""), "Payment details");
                    }}
                    className="px-3 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white hover:bg-white/10"
                    disabled={!m.details}
                  >
                    Copy
                  </button>
                </div>
                {m.instructions && (
                  <p className="text-xs text-[#9CA3AF] mt-2">
                    {m.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5">
            <label className="block mb-2 text-sm font-medium">
              Reference (optional)
            </label>
            <input
              className="u-input"
              placeholder="Transaction ID / note you used"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              disabled={!canSubmit}
            />
          </div>
        </div>

        {/* Proof */}
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Upload proof</h3>
            <span className="text-xs text-[#9CA3AF]">PNG/JPG/PDF</span>
          </div>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Upload a screenshot/receipt showing the amount and receiver details.
          </p>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm text-slate-200 font-medium">
                  Selected file
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  {file ? file.name : "No file selected"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {file && canSubmit && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="btn-secondary"
                  >
                    Remove
                  </button>
                )}
                <label
                  className={`btn-primary ${
                    !canSubmit ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  Choose file
                  <input
                    type="file"
                    disabled={!canSubmit}
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const next = e.target.files?.[0] || null;
                      if (!next) {
                        setFile(null);
                        return;
                      }
                      const allowed = [
                        "image/jpeg",
                        "image/png",
                        "image/webp",
                        "application/pdf",
                      ];
                      if (!allowed.includes(next.type)) {
                        toast("Only PNG/JPG/WEBP/PDF allowed", "error");
                        e.target.value = "";
                        setFile(null);
                        return;
                      }
                      if (next.size > 10 * 1024 * 1024) {
                        toast("File too large (max 10MB)", "error");
                        e.target.value = "";
                        setFile(null);
                        return;
                      }
                      setFile(next);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <p className="mt-3 text-xs text-[#9CA3AF]">
              Tip: include both amount + receiver details in the screenshot.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Safety & trust</p>
            <ul className="mt-2 space-y-2 text-xs text-[#9CA3AF]">
              <li>• We never ask for your password or login codes.</li>
              <li>• Payments are verified manually to prevent fraud.</li>
              <li>• Fake or reused proofs will be rejected.</li>
            </ul>
          </div>
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
        Need help? Open your <span className="text-white">My Orders</span> page
        and use the order chat.
      </p>

      {/* FAQ */}
      <div className="card">
        <h3 className="font-semibold">Payment FAQ</h3>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          New here? These are the most common questions.
        </p>

        <div className="mt-4 space-y-2">
          {[
            {
              q: "What should my payment proof include?",
              a: "A clear screenshot/receipt showing the amount, receiver details, and date/time (if available).",
            },
            {
              q: "How long does verification take?",
              a: "We verify manually. Most proofs are verified within a few minutes, but it can take longer during peak times.",
            },
            {
              q: "Why was my proof rejected?",
              a: "Common reasons: wrong amount, wrong receiver, cropped/blurred image, reused proof, or missing transaction details.",
            },
            {
              q: "Can I upload a PDF instead of an image?",
              a: "Yes. PDFs and images are accepted for proof uploads.",
            },
            {
              q: "What if I used a different payment method than I selected?",
              a: "Select the method you actually used. If unsure, choose the closest match and tell support in the order chat.",
            },
            {
              q: "I submitted proof — what happens next?",
              a: "You’ll be redirected to your order details. Support chat opens automatically so you can message us if needed.",
            },
          ].map((item, idx) => {
            const open = faqOpen === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-white/10 bg-white/5"
              >
                <button
                  type="button"
                  onClick={() =>
                    setFaqOpen((cur) => (cur === idx ? null : idx))
                  }
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium text-slate-200">
                    {item.q}
                  </span>
                  <span className="text-[#9CA3AF]">{open ? "−" : "+"}</span>
                </button>
                {open && (
                  <div className="px-4 pb-4 text-sm text-[#9CA3AF]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
