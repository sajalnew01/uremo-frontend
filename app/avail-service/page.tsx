"use client";

// PATCH_33: Avail Service page - rebranded from "Buy Service"
// 3-step guided flow: Category → Subcategory → Results Grid
// With TrustBadges and premium UX

import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";
import Link from "next/link";
import { withCacheBust } from "@/lib/cacheBust";
import { useAuth } from "@/hooks/useAuth";
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  useSiteSettings,
} from "@/hooks/useSiteSettings";
import CategoryPicker from "./components/CategoryPicker";
import ListingTypePicker from "./components/ListingTypePicker";
import ServiceFilters from "./components/ServiceFilters";
import TrustBadges from "@/components/TrustBadges";

type Service = {
  _id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  subcategory?: string;
  listingType?: string;
  serviceType?: string;
  countries?: string[];
  platform?: string;
  subject?: string;
  projectName?: string;
  payRate?: number;
  instantDelivery?: boolean;
  deliveryType?: string;
  price: number;
  basePrice?: number; // PATCH_20: Original price before country adjustment
  countryPricing?: Record<string, number>; // PATCH_20: Country-specific prices
  currency?: string;
  images?: string[];
  imageUrl?: string;
  updatedAt?: string;
  active?: boolean;
  status?: string;
  // PATCH_21: Country availability
  availableForCountry?: boolean;
  selectedCountry?: string | null;
};

// PATCH_19: Updated filters to use subcategory
type FiltersState = {
  category: string;
  subcategory: string;
  listingType: string; // Keep for backwards compatibility
  country: string;
  platform: string;
  subject: string;
  projectName: string;
  minPayRate: number;
  sort: string;
};

type Step = 1 | 2 | 3;

// PATCH_21: Service request form data
type ServiceRequestData = {
  serviceId: string;
  serviceName: string;
  country: string;
  name: string;
  email: string;
  message: string;
};

export default function AvailServicePage() {
  const { data: settings } = useSiteSettings();
  const { ready: authReady, isAuthenticated } = useAuth();
  const servicesCopy =
    settings?.services?.list || DEFAULT_PUBLIC_SITE_SETTINGS.services.list;

  // PATCH_19: 3-step flow state
  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  // PATCH_21: Service request modal state
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestData, setRequestData] = useState<ServiceRequestData>({
    serviceId: "",
    serviceName: "",
    country: "",
    name: "",
    email: "",
    message: "",
  });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // PATCH_19: Vision-aligned filters with subcategory
  const [filters, setFilters] = useState<FiltersState>({
    category: "",
    subcategory: "",
    listingType: "", // Legacy
    country: "all",
    platform: "all",
    subject: "all",
    projectName: "all",
    minPayRate: 0,
    sort: "createdAt",
  });

  // PATCH_19: Available filter options from API
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [payRateRange, setPayRateRange] = useState({ min: 0, max: 100 });

  const introText =
    (settings?.services?.trustBlockText || "").trim() ||
    DEFAULT_PUBLIC_SITE_SETTINGS.services.trustBlockText;

  const getStartedHref = isAuthenticated ? "/dashboard" : "/login";

  // PATCH_19: Step navigation handlers
  const handleCategorySelect = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      category: categoryId,
      subcategory: "",
      listingType: "",
      country: "all",
      platform: "all",
      subject: "all",
      projectName: "all",
      minPayRate: 0,
    }));
    setStep(2);
  };

  // PATCH_19: Subcategory selection handler
  const handleSubcategorySelect = (subcategoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      subcategory: subcategoryId,
      listingType: subcategoryId, // Keep in sync for legacy
      country: "all",
      platform: "all",
      subject: "all",
      projectName: "all",
      minPayRate: 0,
    }));
    setStep(3);
  };

  const handleBackToCategories = () => {
    setStep(1);
    setFilters({
      category: "",
      subcategory: "",
      listingType: "",
      country: "all",
      platform: "all",
      subject: "all",
      projectName: "all",
      minPayRate: 0,
      sort: "createdAt",
    });
    setServices([]);
  };

  const handleBackToSubcategories = () => {
    setStep(2);
    setFilters((prev) => ({
      ...prev,
      subcategory: "",
      listingType: "",
      country: "all",
      platform: "all",
      subject: "all",
      projectName: "all",
      minPayRate: 0,
    }));
    setServices([]);
  };

  // PATCH_19: Fetch services with subcategory filter
  const loadServices = useCallback(async () => {
    if (step !== 3 || !filters.category || !filters.subcategory) return;

    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const params = new URLSearchParams();
      params.set("limit", "100");
      params.set("category", filters.category);
      params.set("subcategory", filters.subcategory);

      // Also send listingType for backwards compatibility with old services
      if (
        filters.subcategory === "fresh_account" ||
        filters.subcategory === "already_onboarded"
      ) {
        params.set("listingType", filters.subcategory);
      }

      // Country filter
      if (filters.country && filters.country !== "all") {
        params.set("country", filters.country);
      }
      // Platform filter
      if (filters.platform && filters.platform !== "all") {
        params.set("platform", filters.platform);
      }

      // Subject only for fresh_account
      if (
        filters.subcategory === "fresh_account" &&
        filters.subject &&
        filters.subject !== "all"
      ) {
        params.set("subject", filters.subject);
      }

      // projectName and minPayRate only for already_onboarded
      if (filters.subcategory === "already_onboarded") {
        if (filters.projectName && filters.projectName !== "all") {
          params.set("projectName", filters.projectName);
        }
        if (filters.minPayRate > 0) {
          params.set("minPayRate", String(filters.minPayRate));
        }
      }

      if (filters.sort) params.set("sort", filters.sort);

      const res = await fetch(`${base}/api/services?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res
        .json()
        .catch(() => ({ services: [], filters: {} }));

      // Handle response
      const servicesList = Array.isArray(data)
        ? data
        : Array.isArray(data?.services)
          ? data.services
          : [];
      setServices(servicesList);

      // PATCH_18: Update available filters from API response
      if (data?.filters) {
        // Countries
        if (Array.isArray(data.filters.countries)) {
          setAvailableCountries(data.filters.countries);
        } else {
          setAvailableCountries([]);
        }
        // Platforms
        if (Array.isArray(data.filters.platforms)) {
          setAvailablePlatforms(data.filters.platforms);
        } else {
          setAvailablePlatforms([]);
        }
        // PATCH_18: Subjects only returned for fresh_account
        if (Array.isArray(data.filters.subjects)) {
          setAvailableSubjects(data.filters.subjects);
        } else {
          setAvailableSubjects([]);
        }
        // PATCH_18: Projects only returned for already_onboarded
        if (Array.isArray(data.filters.projects)) {
          setAvailableProjects(data.filters.projects);
        } else {
          setAvailableProjects([]);
        }
        // PATCH_18: PayRate range (payRateMinMax from API)
        if (data.filters.payRateMinMax) {
          setPayRateRange(data.filters.payRateMinMax);
        } else {
          setPayRateRange({ min: 0, max: 100 });
        }
      }

      // PATCH_18: Log ignored filters for debugging
      if (data?.meta?.ignoredFilters?.length > 0) {
        console.log("[BuyService] Ignored filters:", data.meta.ignoredFilters);
      }
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [step, filters]);

  useEffect(() => {
    loadServices();
    // PATCH_16: Auto refresh every 30s
    const intervalId = window.setInterval(loadServices, 30_000);

    // PATCH_16: Listen for services:refresh event (dispatched by JarvisX Write)
    const refreshHandler = () => {
      console.log("[BuyService] services:refresh event received");
      loadServices();
    };
    window.addEventListener("services:refresh", refreshHandler);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("services:refresh", refreshHandler);
    };
  }, [loadServices]);

  // PATCH_21: Handle service request for unavailable country
  const handleRequestService = (service: Service) => {
    setRequestData({
      serviceId: service._id,
      serviceName: service.title,
      country: service.selectedCountry || filters.country || "",
      name: "",
      email: "",
      message: `I'm interested in "${service.title}" for ${service.selectedCountry || filters.country}. Please let me know when it becomes available.`,
    });
    setRequestSuccess(false);
    setRequestModalOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!requestData.name || !requestData.email) {
      alert("Please fill in your name and email");
      return;
    }

    setRequestSubmitting(true);
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/service-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          serviceId: requestData.serviceId,
          serviceName: requestData.serviceName,
          country: requestData.country,
          name: requestData.name,
          email: requestData.email,
          message: requestData.message,
          type: "country_unavailable",
        }),
      });

      if (res.ok) {
        setRequestSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to submit request. Please try again.");
      }
    } catch {
      alert("Failed to submit request. Please try again.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const closeRequestModal = () => {
    setRequestModalOpen(false);
    setRequestSuccess(false);
    setRequestData({
      serviceId: "",
      serviceName: "",
      country: "",
      name: "",
      email: "",
      message: "",
    });
  };

  // PATCH_15: Client-side text search filtering
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (!q) return true;
      const hay = `${s.title || ""} ${s.category || ""} ${
        s.shortDescription || ""
      } ${s.description || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [services, query]);

  return (
    <div className="u-container">
      <div className="mb-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {servicesCopy.title}
            </h1>
            <p className="text-slate-300 max-w-2xl">{introText}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-[#9CA3AF]">
            {(servicesCopy.highlightPills || []).slice(0, 6).map((pill) => (
              <span key={pill} className="u-pill text-slate-200">
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* PATCH_33: Trust Badges */}
        <div className="mt-6 py-4 border-y border-white/10">
          <TrustBadges variant="horizontal" />
        </div>

        {/* PATCH_19: Step indicator */}
        {step > 1 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
            <button
              type="button"
              onClick={() => {
                if (step === 3) handleBackToSubcategories();
                else if (step === 2) handleBackToCategories();
              }}
              className="text-blue-400 hover:text-blue-300 transition"
            >
              ← Back
            </button>
            <span className="text-slate-500">|</span>
            <span>
              {step === 2 &&
                `Category: ${filters.category?.replace(/_/g, " ")}`}
              {step === 3 &&
                `${filters.category?.replace(/_/g, " ")} → ${filters.subcategory?.replace(/_/g, " ")}`}
            </span>
          </div>
        )}
      </div>

      {/* PATCH_19: Step 1 - Category Selection */}
      {step === 1 && (
        <CategoryPicker
          selected={filters.category}
          onSelect={handleCategorySelect}
        />
      )}

      {/* PATCH_19: Step 2 - Subcategory Selection */}
      {step === 2 && (
        <ListingTypePicker
          category={filters.category}
          selected={filters.subcategory}
          onSelect={handleSubcategorySelect}
          onBack={handleBackToCategories}
        />
      )}

      {/* PATCH_19: Step 3 - Filters + Results */}
      {step === 3 && (
        <>
          {/* Search and Filters */}
          <div className="space-y-4 mb-8">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={servicesCopy.searchPlaceholder}
                className="u-input placeholder:text-slate-400 w-full"
              />
            </div>

            <ServiceFilters
              filters={filters}
              setFilters={setFilters}
              availableCountries={availableCountries}
              availablePlatforms={availablePlatforms}
              availableSubjects={availableSubjects}
              availableProjects={availableProjects}
              payRateRange={payRateRange}
              onRefresh={loadServices}
              onBack={handleBackToSubcategories}
              loading={loading}
            />
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="card">
                  <div className="h-40 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
                  <div className="mt-4 h-4 w-2/3 bg-white/5 rounded animate-pulse" />
                  <div className="mt-3 h-3 w-1/2 bg-white/5 rounded animate-pulse" />
                  <div className="mt-6 h-10 w-32 bg-white/5 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <h3 className="text-lg font-semibold">
                {servicesCopy.emptyTitle}
              </h3>
              <p className="text-sm text-slate-300 mt-2">
                {servicesCopy.emptySubtitle}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleBackToCategories}
                  className="btn-secondary w-full sm:w-auto"
                >
                  {servicesCopy.resetFiltersText}
                </button>
                <Link
                  href={getStartedHref}
                  className="btn-primary w-full sm:w-auto"
                >
                  {servicesCopy.getStartedText}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((s) => {
                // PATCH_21: Check if service is unavailable for selected country
                const isUnavailable =
                  s.availableForCountry === false &&
                  filters.country &&
                  filters.country !== "all";

                return isUnavailable ? (
                  // PATCH_21: Unavailable service card - greyed out with Request button
                  <div
                    key={s._id}
                    className="card overflow-hidden h-full flex flex-col opacity-60 border-orange-500/20 bg-slate-900/50"
                  >
                    <div className="relative">
                      <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-500/15 via-white/5 to-slate-500/10 aspect-video grayscale">
                        {s.imageUrl ||
                        (Array.isArray(s.images) && s.images[0]) ? (
                          <img
                            src={withCacheBust(
                              s.imageUrl || s.images?.[0],
                              s.updatedAt || s._id,
                            )}
                            alt={s.title}
                            className="h-full w-full object-cover opacity-70"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-white/50">
                            <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-xl">
                              ✦
                            </div>
                          </div>
                        )}
                      </div>

                      {/* PATCH_21: Unavailable badge */}
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs border border-orange-500/40 bg-orange-500/20 text-orange-200 font-semibold">
                          Not Available
                        </span>
                      </div>

                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-slate-400">
                          {s.platform || s.category?.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-4 flex-1">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-semibold text-slate-300 truncate">
                          {s.title}
                        </h3>
                        <p className="mt-2 text-sm text-orange-300/80">
                          ⚠️ Not available in{" "}
                          {s.selectedCountry || filters.country}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-400 mt-4 line-clamp-2 flex-1">
                      {s.shortDescription || s.description}
                    </p>

                    {/* PATCH_21: Request Service button */}
                    <div className="mt-auto pt-4">
                      <button
                        type="button"
                        onClick={() => handleRequestService(s)}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-200 font-medium hover:from-orange-500/30 hover:to-amber-500/30 hover:border-orange-500/50 transition-all"
                      >
                        📩 Request This Service
                      </button>
                      <p className="mt-2 text-xs text-slate-400 text-center">
                        We&apos;ll notify you when available
                      </p>
                    </div>
                  </div>
                ) : (
                  // Regular available service card
                  <Link
                    key={s._id}
                    href={`/services/${s._id}`}
                    className="block group"
                  >
                    <div className="card cursor-pointer overflow-hidden h-full flex flex-col hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300">
                      <div className="relative">
                        <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-white/5 to-emerald-500/10 aspect-video">
                          {s.imageUrl ||
                          (Array.isArray(s.images) && s.images[0]) ? (
                            <img
                              src={withCacheBust(
                                s.imageUrl || s.images?.[0],
                                s.updatedAt || s._id,
                              )}
                              alt={s.title}
                              className="h-full w-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-white/70">
                              <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-xl">
                                ✦
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1 rounded-full text-xs border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 font-semibold">
                            ${s.price}
                            {/* PATCH_20: Show if price was adjusted for country */}
                            {s.basePrice && s.basePrice !== s.price && (
                              <span className="ml-1 line-through text-slate-400 text-[10px]">
                                ${s.basePrice}
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-slate-200">
                            {servicesCopy.manualBadgeText}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-4 flex-1">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-semibold text-white truncate">
                            {s.title}
                          </h3>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {s.category && (
                              <span className="u-pill text-slate-200">
                                {s.category.replace(/_/g, " ")}
                              </span>
                            )}
                            {s.listingType && (
                              <span className="u-pill text-slate-200">
                                {s.listingType.replace(/_/g, " ")}
                              </span>
                            )}
                            {s.platform && (
                              <span className="u-pill text-blue-200">
                                {s.platform}
                              </span>
                            )}
                            {s.instantDelivery && (
                              <span className="u-pill text-emerald-200">
                                ⚡ Instant
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs text-[#9CA3AF]">
                            {servicesCopy.fromLabel}
                          </p>
                          <p className="text-2xl font-bold text-emerald-300">
                            ${s.price}
                            {/* PATCH_20: Show original price if different */}
                            {s.basePrice && s.basePrice !== s.price && (
                              <span className="block text-xs line-through text-slate-500">
                                ${s.basePrice}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-slate-300 mt-4 line-clamp-2 flex-1">
                        {s.shortDescription || s.description}
                      </p>

                      <div className="mt-auto pt-4 flex justify-end">
                        <span className="inline-flex items-center gap-2 text-sm text-slate-200 group-hover:text-white transition">
                          {servicesCopy.viewDetailsText}{" "}
                          <span className="text-[#9CA3AF] group-hover:translate-x-1 transition-transform">
                            →
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* PATCH_21: Service Request Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeRequestModal}
          />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeRequestModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              ✕
            </button>

            {requestSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl">
                  ✓
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Request Submitted!
                </h3>
                <p className="text-slate-300 text-sm">
                  We&apos;ve received your request for &quot;
                  {requestData.serviceName}&quot;. We&apos;ll notify you at{" "}
                  {requestData.email} when it becomes available in{" "}
                  {requestData.country}.
                </p>
                <button
                  type="button"
                  onClick={closeRequestModal}
                  className="mt-6 px-6 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-white mb-2">
                  📩 Request Service
                </h3>
                <p className="text-slate-300 text-sm mb-6">
                  &quot;{requestData.serviceName}&quot; isn&apos;t available in{" "}
                  <span className="text-orange-300">{requestData.country}</span>{" "}
                  yet. Fill in your details and we&apos;ll notify you when it
                  becomes available.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={requestData.name}
                      onChange={(e) =>
                        setRequestData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={requestData.email}
                      onChange={(e) =>
                        setRequestData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">
                      Additional Message (optional)
                    </label>
                    <textarea
                      value={requestData.message}
                      onChange={(e) =>
                        setRequestData((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Any specific requirements..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition resize-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={closeRequestModal}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitRequest}
                    disabled={requestSubmitting}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {requestSubmitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
