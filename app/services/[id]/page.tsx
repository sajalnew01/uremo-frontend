"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    apiRequest(`/api/services/${id}`)
      .then((data) => {
        if (!mounted) return;
        setService(data);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setService(null);
        setError(e?.message || "Service not found");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const buyService = async () => {
    try {
      const res = await apiRequest(
        "/api/orders",
        "POST",
        { serviceId: service._id },
        true
      );
      const orderId = res?.orderId;
      if (!orderId) throw new Error("Failed to create order");

      toast("Order reserved. Complete payment to confirm.", "success");
      router.push(`/payment/${orderId}`);
    } catch (e: any) {
      toast(e?.message || "Login required", "error");
      if ((e?.message || "").toLowerCase().includes("login")) {
        router.push("/login");
      }
    }
  };

  if (loading) {
    return (
      <div className="u-container max-w-5xl">
        <div className="card">
          <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
          <div className="mt-3 h-4 w-3/4 rounded bg-white/10 animate-pulse" />
          <div className="mt-2 h-4 w-2/3 rounded bg-white/10 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="u-container max-w-5xl">
        <div className="card">
          <p className="text-white font-semibold">Service not available</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            {error ||
              "This service may have been removed or is temporarily unavailable."}
          </p>
          <div className="mt-4 flex gap-3 flex-wrap">
            <Link href="/buy-service" className="btn-secondary">
              Back to services
            </Link>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const deliveryLabel = service?.deliveryType
    ? String(service.deliveryType).replace(/_/g, " ")
    : "manual";
  const requirementsRaw = service?.requirements;
  const requirementsText =
    typeof requirementsRaw === "string" ? requirementsRaw.trim() : "";
  const requirementsLines = requirementsText
    ? requirementsText
        .split(/\r?\n/)
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="u-container max-w-6xl">
      {/* Hero Image Section (always render) */}
      <div className="mb-8 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-white/5 to-emerald-500/10">
        {service.imageUrl ||
        (Array.isArray(service.images) && service.images[0]) ? (
          <img
            src={service.imageUrl || service.images?.[0]}
            alt={service.title}
            className="h-80 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-80 w-full flex items-center justify-center">
            <div className="text-center px-6">
              <div className="mx-auto w-16 h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-2xl text-white/80">
                ✦
              </div>
              <p className="mt-4 text-sm text-slate-200 font-medium">
                Premium manual service
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Verified by human specialists
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/buy-service"
            className="text-sm text-[#9CA3AF] hover:text-white transition"
          >
            ← Back to services
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            {service.title}
          </h1>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {service?.category && (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#E5E7EB]">
                {String(service.category)}
              </span>
            )}
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#E5E7EB]">
              {deliveryLabel}
            </span>
            {service?.active === false && (
              <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs text-orange-200">
                Currently unavailable
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Main */}
        <div className="space-y-6">
          <div className="card">
            <p className="text-sm text-[#9CA3AF]">Overview</p>
            <p className="mt-2 text-slate-200 leading-relaxed">
              {service.description || "No description provided."}
            </p>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold">What you get</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              <li className="flex gap-2">
                <span className="text-emerald-300">•</span>
                <span>Manual processing by a human operations specialist.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-300">•</span>
                <span>Order tracking with clear status updates.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-300">•</span>
                <span>Secure payment verification workflow.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-300">•</span>
                <span>Communication via your order chat when needed.</span>
              </li>
            </ul>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold">Requirements</h2>
            {requirementsLines.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {requirementsLines.map((line: string, idx: number) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-blue-300">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[#9CA3AF]">
                No requirements listed. If we need anything else, we'll message
                you inside the order.
              </p>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold">Delivery time</h2>
            <p className="mt-3 text-sm text-slate-200">
              This is a{" "}
              <span className="text-white font-medium">{deliveryLabel}</span>{" "}
              service. Delivery is handled in a queue and verified manually;
              you'll see progress updates in your order.
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-[#9CA3AF]">
                Safety note: UREMO will never ask for your password or sensitive
                login credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky CTA */}
        <aside className="lg:sticky lg:top-24">
          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#9CA3AF]">Price</p>
                <p className="mt-1 text-3xl font-bold text-emerald-300">
                  ${service.price}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Manual verification included
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-xs text-[#9CA3AF]">Type</p>
                <p className="text-sm text-slate-200 font-medium">
                  {deliveryLabel}
                </p>
              </div>
            </div>

            <div className="mt-4 h-px bg-white/10" />

            <button
              type="button"
              onClick={buyService}
              disabled={service?.active === false}
              className="btn-primary w-full disabled:opacity-50"
            >
              {service?.active === false ? "Unavailable" : "Reserve & pay"}
            </button>

            <p className="mt-3 text-xs text-[#9CA3AF]">
              Reserving creates an order and redirects you to payment.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
