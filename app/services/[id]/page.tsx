"use client";

// PATCH_33: Service Detail Page with TrustBadges
// PATCH_55: Service Detail Decision Engine - Action selector, trust panel, flow timeline, sticky bar

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { withCacheBust } from "@/lib/cacheBust";
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  useSiteSettings,
} from "@/hooks/useSiteSettings";
import TrustBadges from "@/components/TrustBadges";
import ServiceActionSelector from "@/components/ServiceActionSelector";
import ServiceTrustPanel from "@/components/ServiceTrustPanel";
import ServiceFlowTimeline from "@/components/ServiceFlowTimeline";
import StickyActionBar from "@/components/StickyActionBar";
import {
  getCategoryLabel,
  getSubcategoryLabel,
} from "@/lib/categoryLabels";

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
  // PATCH_38: Deal percent (1..100)
  const [dealPercent, setDealPercent] = useState<number>(10);
  // PATCH_22: Selected rental plan for rental services
  const [selectedRentalPlan, setSelectedRentalPlan] = useState<number | null>(
    null,
  );

  const normalizeAllowedActions = (value: any) => {
    const a = value && typeof value === "object" ? value : {};
    return {
      buy: Boolean(a.buy),
      apply: Boolean(a.apply),
      rent: Boolean(a.rent),
      deal: Boolean(a.deal),
    };
  };

  const ensureLoggedIn = () => {
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
        return false;
      }
    } catch {
      return false;
    }
    return true;
  };

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

  // PATCH_38: Fetch allowed actions explicitly (works even if older service payloads omit it)
  useEffect(() => {
    if (!id) return;
    if (!service?._id) return;

    let mounted = true;
    apiRequest(`/api/services/${id}/actions`, "GET")
      .then((data: any) => {
        if (!mounted) return;
        const allowed = normalizeAllowedActions(data?.allowedActions);
        setService((prev: any) => {
          if (!prev) return prev;
          return { ...prev, allowedActions: allowed };
        });
      })
      .catch(() => {
        // ignore (service detail already loaded)
      });

    return () => {
      mounted = false;
    };
  }, [id, service?._id]);

  const buyService = async (overridePlanIndex?: number | null) => {
    // PATCH_12: Hard redirect if not logged in, with next param.
    // This avoids endless "Authentication required" toasts.
    if (!ensureLoggedIn()) return;

    // PATCH_90: Check permissions before making API calls to prevent 403 errors
    const allowed = normalizeAllowedActions(service?.allowedActions);

    // Resolve final plan index: direct param > state > null
    const finalPlanIndex = overridePlanIndex !== undefined ? overridePlanIndex : selectedRentalPlan;

    // PATCH_22: Validate rental plan selection for rental services
    if (service?.isRental && finalPlanIndex === null) {
      // PATCH_90: Only prompt for rental plan if rent is actually allowed
      if (!allowed.rent) {
        toast(
          "Rentals are not available for this service. Try Buy instead.",
          "error",
        );
        return;
      }
      toast("Please select a rental plan", "error");
      return;
    }

    // PATCH_22: For rental services, create a rental order instead
    if (service?.isRental && finalPlanIndex !== null) {
      // PATCH_90: Verify rent permission before calling API
      if (!allowed.rent) {
        toast(
          "Rentals are not available for this service. Try Buy instead.",
          "error",
        );
        return;
      }
      try {
        const res = await apiRequest(
          "/api/rentals/create",
          "POST",
          {
            serviceId: service._id,
            planIndex: finalPlanIndex,
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

  // PATCH_47: Apply to work with service context - passes serviceId to find linked job role
  const applyToWork = async () => {
    if (!ensureLoggedIn()) return;

    try {
      // Try to find the linked job role for this service
      const jobRoleRes = await apiRequest(
        `/api/work-positions/by-service/${service._id}`,
        "GET",
      );

      if (jobRoleRes?.hasJobRole && jobRoleRes.position?._id) {
        // Direct link to the specific job role
        router.push(
          `/apply-to-work?positionId=${jobRoleRes.position._id}&serviceId=${service._id}`,
        );
      } else {
        // No linked job role, go to general apply page with service context
        router.push(
          `/apply-to-work?serviceId=${service._id}&serviceTitle=${encodeURIComponent(service.title)}`,
        );
      }
    } catch {
      // Fallback to general apply page
      router.push("/apply-to-work");
    }
  };

  const createDealOrder = async () => {
    if (!ensureLoggedIn()) return;

    // PATCH_75: Verify service allows deals before creating order
    const allowed = normalizeAllowedActions(service?.allowedActions);
    if (!allowed.deal) {
      toast(
        "Deals are not available for this service. Try Buy or Apply instead.",
        "error",
      );
      return;
    }

    const pct = Number(dealPercent);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      toast("Deal percent must be between 1 and 100", "error");
      return;
    }

    try {
      const res = await apiRequest(
        "/api/orders/deal",
        "POST",
        { serviceId: service._id, dealPercent: pct },
        true,
      );
      const orderId = res?.orderId;
      if (!orderId) throw new Error("Failed to create deal order");
      toast("Deal created. Complete payment to confirm.", "success");
      router.push(`/payment/${orderId}`);
    } catch (e: any) {
      toast(e?.message || "Failed to create deal order", "error");
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
            <Link href="/explore-services" className="btn-secondary">
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

  const allowed = normalizeAllowedActions(service?.allowedActions);
  const hasAnyAction =
    allowed.buy || allowed.apply || allowed.rent || allowed.deal;

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
  const categoryLabel = getCategoryLabel(
    service?.effectiveCategory || service?.category || "",
  );
  const subcategoryLabel = service?.subcategory
    ? getSubcategoryLabel(service.subcategory)
    : "";

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

      {/* PATCH_55: Service Action Decision Section (Above the Fold) */}
      <div className="mb-8">
        <ServiceActionSelector
          price={service.price}
          payRate={service.payRate}
          allowedActions={allowed}
          rentalPlans={service.rentalPlans}
          isRental={service.isRental}
          isActive={service.active !== false}
          onBuy={buyService}
          onApply={applyToWork}
          onRent={(planIndex) => {
            setSelectedRentalPlan(planIndex);
            buyService(planIndex);
          }}
          onDeal={createDealOrder}
          selectedRentalPlan={selectedRentalPlan}
          onSelectRentalPlan={setSelectedRentalPlan}
        />
      </div>

      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/explore-services"
            className="text-sm text-[#9CA3AF] hover:text-white transition"
          >
            ← {copy.backToServicesText}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            {service.title}
          </h1>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {categoryLabel && (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#E5E7EB]">
                {categoryLabel}
              </span>
            )}
            {subcategoryLabel && (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs text-[#E5E7EB]">
                {subcategoryLabel}
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

          {/* PATCH_40: Who This Is For - Category-based messaging */}
          <div className="card">
            <h2 className="text-lg font-semibold">Who This Is For</h2>
            <div className="mt-3 space-y-3">
              {allowed.buy && (
                <div className="flex gap-3 text-sm text-slate-200">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
                    💳
                  </span>
                  <div>
                    <p className="font-medium text-white">Buyers</p>
                    <p className="text-xs text-slate-400">
                      Purchase this service and receive direct fulfillment
                    </p>
                  </div>
                </div>
              )}
              {allowed.apply && (
                <div className="flex gap-3 text-sm text-slate-200">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                    💼
                  </span>
                  <div>
                    <p className="font-medium text-white">Workers</p>
                    <p className="text-xs text-slate-400">
                      Apply to complete tasks and earn money to your wallet
                    </p>
                  </div>
                </div>
              )}
              {allowed.rent && (
                <div className="flex gap-3 text-sm text-slate-200">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    🔑
                  </span>
                  <div>
                    <p className="font-medium text-white">Renters</p>
                    <p className="text-xs text-slate-400">
                      Get temporary access to accounts or services
                    </p>
                  </div>
                </div>
              )}
              {allowed.deal && (
                <div className="flex gap-3 text-sm text-slate-200">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                    🤝
                  </span>
                  <div>
                    <p className="font-medium text-white">Deal Seekers</p>
                    <p className="text-xs text-slate-400">
                      Pay a percentage upfront, get service at a discount
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PATCH_40: How It Works - 3-Step Flow */}
          <div className="card">
            <h2 className="text-lg font-semibold">How It Works</h2>
            <div className="mt-4 relative">
              {/* Connection Line */}
              <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500/50 via-emerald-500/50 to-purple-500/50" />

              <div className="space-y-6">
                <div className="flex gap-4 relative">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center z-10">
                    <span className="text-xs font-bold text-blue-300">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Place Your Order</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select your option and complete secure payment
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center z-10">
                    <span className="text-xs font-bold text-emerald-300">
                      2
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Admin Verifies</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Our team reviews and processes your order
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 relative">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center z-10">
                    <span className="text-xs font-bold text-purple-300">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      Receive Your Service
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Get access or credentials delivered to your dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>
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

          {/* PATCH_55: What Happens Next? Flow Timeline */}
          <ServiceFlowTimeline allowedActions={allowed} />

          {/* PATCH_55: Trust & Safety Panel */}
          <ServiceTrustPanel />

          {/* PATCH_33: Trust Badges Section (kept for additional trust signals) */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Why Choose UREMO?</h2>
            <TrustBadges variant="vertical" />
          </div>
        </div>

        {/* Sticky CTA */}
        <aside className="lg:sticky lg:top-24">
          <div className="card">
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

            <div className="mt-4 flex flex-wrap gap-2">
              {allowed.buy && (
                <span className="text-[11px] rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-1 text-blue-200">
                  Buy
                </span>
              )}
              {allowed.apply && (
                <span className="text-[11px] rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
                  Apply
                </span>
              )}
              {allowed.rent && (
                <span className="text-[11px] rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 py-1 text-purple-200">
                  Rent
                </span>
              )}
              {allowed.deal && (
                <span className="text-[11px] rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-amber-200">
                  Deal
                </span>
              )}
            </div>

            <div className="mt-4 h-px bg-white/10" />

            {!hasAnyAction && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-200 font-medium">
                  No actions available
                </p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  This service is not eligible for buy, apply, rent, or deal.
                </p>
              </div>
            )}

            {/* RENT */}
            {allowed.rent &&
            service?.isRental &&
            Array.isArray(service.rentalPlans) &&
            service.rentalPlans.length > 0 ? (
              <div className="mt-4">
                <div className="mb-3">
                  <p className="text-sm text-[#9CA3AF]">🔄 Rental plans</p>
                  <p className="mt-1 text-sm text-slate-200">
                    Choose a plan before renting.
                  </p>
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
                <button
                  type="button"
                  onClick={() => buyService()}
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
              </div>
            ) : null}

            {/* BUY */}
            {allowed.buy && (
              <button
                type="button"
                onClick={() => buyService()}
                disabled={service?.active === false}
                className="btn-primary w-full disabled:opacity-50 mt-4"
              >
                {service?.active === false
                  ? copy.unavailableButtonText
                  : "Buy Now"}
              </button>
            )}

            {/* APPLY */}
            {allowed.apply && (
              <button
                type="button"
                onClick={applyToWork}
                disabled={service?.active === false}
                className="btn-secondary w-full disabled:opacity-50 mt-3"
              >
                Apply To Work
              </button>
            )}

            {/* DEAL */}
            {allowed.deal && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-200 font-medium">
                    Deal percent
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={dealPercent}
                      onChange={(e) => setDealPercent(Number(e.target.value))}
                      className="w-20 rounded-md bg-black/20 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/40"
                    />
                    <span className="text-sm text-[#9CA3AF]">%</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={createDealOrder}
                  disabled={service?.active === false}
                  className="btn-primary w-full disabled:opacity-50 mt-3"
                >
                  {service?.active === false
                    ? copy.unavailableButtonText
                    : `Complete Deal @ ${dealPercent}%`}
                </button>
                <p className="mt-2 text-xs text-[#9CA3AF]">
                  Creates a deal order and redirects to payment.
                </p>
              </div>
            )}

            <p className="mt-3 text-xs text-[#9CA3AF]">
              {copy.reserveHelpText}
            </p>
          </div>
        </aside>
      </div>

      {/* PATCH_55: Sticky Action Bar (Desktop + Mobile) */}
      <StickyActionBar
        serviceTitle={service.title}
        price={service.price}
        payRate={service.payRate}
        allowedActions={allowed}
        rentalPlans={service.rentalPlans}
        selectedRentalPlan={selectedRentalPlan}
        isActive={service.active !== false}
        onBuy={buyService}
        onApply={applyToWork}
        onRent={buyService}
        onDeal={createDealOrder}
        onHelp={() => {
          // Open JarvisX or support
          if (typeof window !== "undefined") {
            window.location.href = "/support";
          }
        }}
      />
    </div>
  );
}
