"use client";

// PATCH_33: Service Detail Page with TrustBadges

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { withCacheBust } from "@/lib/cacheBust";
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  useSiteSettings,
} from "@/hooks/useSiteSettings";
import TrustBadges from "@/components/TrustBadges";

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const lastAuthToastAtRef = useRef(0);
  const { data: settings } = useSiteSettings();
  const copy =
    settings?.services?.details ||
    DEFAULT_PUBLIC_SITE_SETTINGS.services.details;
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  // PATCH_22: Selected rental plan for rental services
  const [selectedRentalPlan, setSelectedRentalPlan] = useState<number | null>(
    null,
  );

  const template = (value: string, vars: Record<string, string>) => {
    let out = String(value || "");
    for (const [key, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${key}}`, v);
    }
    return out;
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    apiRequest(`/api/services/${id}`)
      .then((data) => {
        if (!mounted) return;
        // Backend returns { ok: true, service: {...} }
        setService(data.service || data);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setService(null);
        setError(e?.message || copy.notAvailableTitle);
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
    // PATCH_12: Hard redirect if not logged in, with next param.
    // This avoids endless "Authentication required" toasts.
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        const next =
          typeof window !== "undefined" && window.location?.pathname
            ? window.location.pathname
            : `/services/${String(id || "")}`;
        if (typeof window !== "undefined") {
          window.location.href = `/login?next=${encodeURIComponent(next)}`;
        } else {
          router.push("/login");
        }
        return;
      }
    } catch {
      // ignore
    }

    // PATCH_22: Validate rental plan selection for rental services
    if (service?.isRental && selectedRentalPlan === null) {
      toast("Please select a rental plan", "error");
      return;
    }

    // PATCH_22: For rental services, create a rental order instead
    if (service?.isRental && selectedRentalPlan !== null) {
      try {
        const plan = service.rentalPlans[selectedRentalPlan];
        const res = await apiRequest(
          "/api/rentals/create",
          "POST",
          {
            serviceId: service._id,
            rentalType: plan.unit,
            duration: plan.duration,
          },
          true,
        );
        const orderId = res?.order?._id || res?.orderId;
        if (!orderId) throw new Error("Failed to create rental order");

        toast("Rental reserved. Complete payment to confirm.", "success");
        router.push(`/payment/${orderId}`);
      } catch (e: any) {
        toast(e?.message || "Failed to create rental order", "error");
      }
      return;
    }

    try {
      const res = await apiRequest(
        "/api/orders",
        "POST",
        { serviceId: service._id },
        true,
      );
      const orderId = res?.orderId;
      if (!orderId) throw new Error("Failed to create order");

      toast("Order reserved. Complete payment to confirm.", "success");
      router.push(`/payment/${orderId}`);
    } catch (e: any) {
      const msg = String(e?.message || "").trim();
      const isAuthError =
        (msg && msg.toLowerCase().includes("authentication required")) ||
        (msg && msg.toLowerCase().includes("unauthorized"));

      if (isAuthError) {
        const now = Date.now();
        if (now - lastAuthToastAtRef.current >= 2000) {
          lastAuthToastAtRef.current = now;
          toast("Please login to continue.", "error");
        }

        const next =
          typeof window !== "undefined" && window.location?.pathname
            ? window.location.pathname
            : `/services/${String(id || "")}`;
        if (typeof window !== "undefined") {
          window.location.href = `/login?next=${encodeURIComponent(next)}`;
        } else {
          router.push("/login");
        }
        return;
      }

      toast(msg || "Login required", "error");
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
          <p className="text-white font-semibold">{copy.notAvailableTitle}</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            {error || copy.notAvailableSubtitle}
          </p>
          <div className="mt-4 flex gap-3 flex-wrap">
            <Link href="/buy-service" className="btn-secondary">
              {copy.backToServicesText}
            </Link>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="btn-primary"
            >
              {copy.retryText}
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
            src={withCacheBust(
              service.imageUrl || service.images?.[0],
              service.updatedAt || service._id,
            )}
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
                {copy.premiumPlaceholderTitle}
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                {copy.premiumPlaceholderSubtitle}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/avail-service"
            className="text-sm text-[#9CA3AF] hover:text-white transition"
          >
            ← {copy.backToServicesText}
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
            <p className="text-sm text-[#9CA3AF]">{copy.overviewLabel}</p>
            <p className="mt-2 text-slate-200 leading-relaxed">
              {service.description || "No description provided."}
            </p>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold">{copy.whatYouGetTitle}</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {(Array.isArray(copy.whatYouGetBullets)
                ? copy.whatYouGetBullets
                : []
              ).map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-emerald-300">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold">{copy.requirementsTitle}</h2>
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
                {copy.requirementsEmptyText}
              </p>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold">{copy.deliveryTimeTitle}</h2>
            <p className="mt-3 text-sm text-slate-200">
              {template(copy.deliveryTimeBody, { deliveryLabel })}
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-[#9CA3AF]">{copy.safetyNote}</p>
            </div>
          </div>

          {/* PATCH_33: Trust Badges Section */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Why Choose UREMO?</h2>
            <TrustBadges variant="vertical" />
          </div>
        </div>

        {/* Sticky CTA */}
        <aside className="lg:sticky lg:top-24">
          <div className="card">
            {/* PATCH_22: Rental Plans UI */}
            {service?.isRental &&
            Array.isArray(service.rentalPlans) &&
            service.rentalPlans.length > 0 ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-[#9CA3AF]">🔄 Rental Service</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    Choose a Plan
                  </p>
                  {service.rentalDescription && (
                    <p className="mt-2 text-xs text-slate-400">
                      {service.rentalDescription}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  {service.rentalPlans.map((plan: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedRentalPlan(idx)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedRentalPlan === idx
                          ? "border-purple-500 bg-purple-500/20"
                          : "border-white/10 bg-white/5 hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {plan.label}
                          </span>
                          {plan.isPopular && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
                              ⭐ Popular
                            </span>
                          )}
                        </div>
                        <span className="text-emerald-300 font-bold">
                          ${plan.price}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {plan.duration} {plan.unit}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="mt-4 h-px bg-white/10" />
                <button
                  type="button"
                  onClick={buyService}
                  disabled={
                    service?.active === false || selectedRentalPlan === null
                  }
                  className="btn-primary w-full disabled:opacity-50 mt-4"
                >
                  {service?.active === false
                    ? copy.unavailableButtonText
                    : selectedRentalPlan !== null
                      ? `Rent for $${service.rentalPlans[selectedRentalPlan]?.price}`
                      : "Select a Plan"}
                </button>
                <p className="mt-3 text-xs text-[#9CA3AF]">
                  {copy.reserveHelpText}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#9CA3AF]">{copy.priceLabel}</p>
                    <p className="mt-1 text-3xl font-bold text-emerald-300">
                      ${service.price}
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      {copy.priceSubtext}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-xs text-[#9CA3AF]">{copy.typeLabel}</p>
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
                  {service?.active === false
                    ? copy.unavailableButtonText
                    : copy.reserveButtonText}
                </button>

                <p className="mt-3 text-xs text-[#9CA3AF]">
                  {copy.reserveHelpText}
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
