"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  useSiteSettings,
} from "@/hooks/useSiteSettings";

export default function PaymentPage() {
  const { orderId } = useParams();
  const resolvedOrderId = Array.isArray(orderId) ? orderId[0] : orderId;
  const router = useRouter();
  const { toast } = useToast();
  const { data: settings } = useSiteSettings();

  const ui = settings?.payment?.ui || DEFAULT_PUBLIC_SITE_SETTINGS.payment.ui;

  const acceptedProofText =
    (settings?.payment?.acceptedProofText || "").trim() ||
    DEFAULT_PUBLIC_SITE_SETTINGS.payment.acceptedProofText;

  const successRedirectText =
    (settings?.payment?.successRedirectText || "").trim() ||
    DEFAULT_PUBLIC_SITE_SETTINGS.payment.successRedirectText;

  const [order, setOrder] = useState<any>(null);
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const paymentFaq =
    settings?.payment?.faq && settings.payment.faq.length
      ? settings.payment.faq
      : DEFAULT_PUBLIC_SITE_SETTINGS.payment.faq;

  const normalizeError = (e: any) => {
    const msg = String(e?.message || "").trim();
    return msg || "Failed to load payment details.";
  };

  const maybeRedirectToLogin = (e: any) => {
    const msg = String(e?.message || "").toLowerCase();
    if (
      msg.includes("auth") ||
      msg.includes("token") ||
      msg.includes("login")
    ) {
      router.push("/login");
      return true;
    }
    return false;
  };

  const loadOrder = async () => {
    setLoadError(null);
    const data = await apiRequest(
      `/api/orders/${resolvedOrderId}`,
      "GET",
      null,
      true
    );
    setOrder(data);
  };

  useEffect(() => {
    let mounted = true;

    loadOrder().catch((e) => {
      if (!mounted) return;
      if (maybeRedirectToLogin(e)) return;
      const msg = normalizeError(e);
      setLoadError(msg);
      toast(msg, "error");
    });

    apiRequest("/api/payments", "GET")
      .then((list) => {
        if (!mounted) return;
        setMethods(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        if (!mounted) return;
        // Methods are optional for initial render; don't crash.
        console.warn("Failed to load payment methods", e);
        setMethods([]);
      });

    return () => {
      mounted = false;
    };
  }, [resolvedOrderId]);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast(ui.paymentDetailsCopiedText, "success");
    } catch {
      toast(ui.copyFailedText, "error");
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
      toast(ui.selectMethodRequiredText, "error");
      return;
    }
    if (!file) {
      toast(ui.proofRequiredText, "error");
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

      toast(successRedirectText, "success");
      setFile(null);
      router.push(`/orders/${resolvedOrderId}?chat=1`);
    } catch (e: any) {
      toast(e.message || ui.submitFailedText, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    if (loadError) {
      return (
        <div className="u-container max-w-3xl py-10">
          <div className="card">
            <p className="text-sm text-[#9CA3AF]">Payment</p>
            <h1 className="text-2xl font-bold text-white mt-2">
              Unable to load payment
            </h1>
            <p className="text-slate-300 mt-3 whitespace-pre-wrap">
              {loadError}
            </p>
            <div className="mt-6 flex gap-3 flex-wrap">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setOrder(null);
                  setMethods([]);
                  loadOrder().catch((e) => {
                    if (maybeRedirectToLogin(e)) return;
                    const msg = normalizeError(e);
                    setLoadError(msg);
                    toast(msg, "error");
                  });
                }}
              >
                Try again
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => router.push("/orders")}
              >
                Back to orders
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <p className="p-6">{ui.loadingText}</p>;
  }

  return (
    <div className="u-container max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{ui.title}</h1>
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="text-sm text-[#9CA3AF] hover:text-white transition"
        >
          {ui.viewOrdersText}
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
                      ? ui.wizardStep1Title
                      : n === 2
                      ? ui.wizardStep2Title
                      : ui.wizardStep3Title}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    {n === 1
                      ? ui.wizardStep1Subtitle
                      : n === 2
                      ? ui.wizardStep2Subtitle
                      : ui.wizardStep3Subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 h-px bg-white/10" />

        <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-[#9CA3AF]">{ui.orderIdLabel}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-slate-200 font-mono text-xs break-all">
                {String(resolvedOrderId || "")}
              </p>
              <button
                type="button"
                onClick={() => copy(String(resolvedOrderId || ""))}
                className="px-3 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white hover:bg-white/10"
              >
                {ui.copyButtonText}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-[#9CA3AF]">{ui.paymentSummaryLabel}</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-slate-200">{order.serviceId?.title}</p>
              <p className="text-emerald-300 font-semibold">
                ${order.serviceId?.price}
              </p>
            </div>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              {ui.paymentSummaryHint}
            </p>
          </div>
        </div>
      </div>

      {isExpired && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          <p className="font-semibold">{ui.expiredTitle}</p>
          <p className="text-sm opacity-90 mt-1">{ui.expiredBody}</p>
          <button
            type="button"
            onClick={() => router.push("/buy-service")}
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-red-500/20 px-3 py-2 text-sm hover:bg-red-500/25"
          >
            {ui.goToServicesText}
          </button>
        </div>
      )}

      {isSubmitted && (
        <div className="card border border-emerald-500/30 bg-emerald-500/10">
          <p className="font-semibold text-emerald-100">
            {ui.paymentSubmittedTitle}
          </p>
          <p className="text-sm text-emerald-200/90 mt-1">
            {ui.paymentSubmittedBody}
          </p>
        </div>
      )}

      {status === "rejected" && (
        <div className="card border border-orange-500/30 bg-orange-500/10">
          <p className="font-semibold text-orange-100">
            {ui.paymentRejectedTitle}
          </p>
          <p className="text-sm text-orange-200/90 mt-1">
            {ui.paymentRejectedBody}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Methods */}
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">{ui.paymentMethodTitle}</h3>
            {!canSubmit && (
              <span className="text-xs text-[#9CA3AF]">{ui.lockedText}</span>
            )}
          </div>

          <p className="mt-1 text-sm text-[#9CA3AF]">{ui.paymentMethodHelp}</p>

          <div className="mt-4 space-y-3">
            {methods.length === 0 && (
              <p className="text-[#9CA3AF] text-sm">
                {ui.noPaymentMethodsText}
              </p>
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
                      copy(String(m.details || ""));
                    }}
                    className="px-3 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white hover:bg-white/10"
                    disabled={!m.details}
                  >
                    {ui.copyButtonText}
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
              {ui.referenceLabel}
            </label>
            <input
              className="u-input"
              placeholder={ui.referencePlaceholder}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              disabled={!canSubmit}
            />
          </div>
        </div>

        {/* Proof */}
        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">{ui.uploadProofTitle}</h3>
            <span className="text-xs text-[#9CA3AF]">
              {ui.allowedTypesText}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#9CA3AF]">{acceptedProofText}</p>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm text-slate-200 font-medium">
                  {ui.selectedFileLabel}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  {file ? file.name : ui.noFileSelectedText}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {file && canSubmit && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="btn-secondary"
                  >
                    {ui.removeFileText}
                  </button>
                )}
                <label
                  className={`btn-primary ${
                    !canSubmit ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  {ui.chooseFileText}
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
                        toast(ui.invalidFileTypeText, "error");
                        e.target.value = "";
                        setFile(null);
                        return;
                      }
                      if (next.size > 10 * 1024 * 1024) {
                        toast(ui.fileTooLargeText, "error");
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

            <p className="mt-3 text-xs text-[#9CA3AF]">{ui.tipText}</p>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">{ui.safetyTitle}</p>
            <ul className="mt-2 space-y-2 text-xs text-[#9CA3AF]">
              {ui.safetyBullets.map((b) => (
                <li key={b}>• {b}</li>
              ))}
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
          ? ui.submitButtonSubmitted
          : status === "rejected"
          ? ui.submitButtonResubmit
          : ui.submitButtonSubmit}
      </button>

      {!isSubmitted && canSubmit && (
        <p className="text-xs text-[#9CA3AF]">
          {ui.statusLinePrefix}{" "}
          {hasMethod ? ui.statusLineMethodSelected : ui.statusLineSelectMethod}
          {" • "}
          {hasProof ? ui.statusLineProofAttached : ui.statusLineAttachProof}
        </p>
      )}

      <p className="text-xs text-[#9CA3AF]">{ui.needHelpText}</p>

      {/* FAQ */}
      <div className="card">
        <h3 className="font-semibold">{ui.faqTitle}</h3>
        <p className="mt-1 text-sm text-[#9CA3AF]">{ui.faqSubtitle}</p>

        <div className="mt-4 space-y-2">
          {paymentFaq.map((item, idx) => {
            const open = faqOpen === idx;
            return (
              <div
                key={`${idx}-${item.q}`}
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
