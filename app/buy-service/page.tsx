"use client";

// PATCH_17: Buy Service page with 3-step flow
// Step 1: Choose Category
// Step 2: Choose Listing Type
// Step 3: Filters + Results Grid

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

type Service = {
  _id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  category?: string;
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
  currency?: string;
  images?: string[];
  imageUrl?: string;
  updatedAt?: string;
  active?: boolean;
  status?: string;
};

type FiltersState = {
  category: string;
  listingType: string;
  country: string;
  platform: string;
  subject: string;
  projectName: string;
  minPayRate: number;
  sort: string;
};

type Step = 1 | 2 | 3;

export default function BuyServicePage() {
  const { data: settings } = useSiteSettings();
  const { ready: authReady, isAuthenticated } = useAuth();
  const servicesCopy =
    settings?.services?.list || DEFAULT_PUBLIC_SITE_SETTINGS.services.list;

  // PATCH_17: 3-step flow state
  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  // PATCH_17: Vision-aligned filters with new fields
  const [filters, setFilters] = useState<FiltersState>({
    category: "",
    listingType: "",
    country: "all",
    platform: "all",
    subject: "all",
    projectName: "all",
    minPayRate: 0,
    sort: "createdAt",
  });

  // PATCH_17: Available filter options from API
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [payRateRange, setPayRateRange] = useState({ min: 0, max: 100 });

  const introText =
    (settings?.services?.trustBlockText || "").trim() ||
    DEFAULT_PUBLIC_SITE_SETTINGS.services.trustBlockText;

  const getStartedHref = isAuthenticated ? "/dashboard" : "/login";

  // PATCH_17: Step navigation handlers
  const handleCategorySelect = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      category: categoryId,
      listingType: "",
      country: "all",
      platform: "all",
      subject: "all",
      projectName: "all",
      minPayRate: 0,
    }));
    setStep(2);
  };

  const handleListingTypeSelect = (listingTypeId: string) => {
    setFilters((prev) => ({
      ...prev,
      listingType: listingTypeId,
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

  const handleBackToListingTypes = () => {
    setStep(2);
    setFilters((prev) => ({
      ...prev,
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
    if (step !== 3 || !filters.category || !filters.listingType) return;

    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const params = new URLSearchParams();
      params.set("limit", "100");
      params.set("category", filters.category);
      // PATCH_19: Send as subcategory (backend now uses this)
      params.set("subcategory", filters.listingType);

      // PATCH_19: Country filter applies to all categories
      if (filters.country && filters.country !== "all") {
        params.set("country", filters.country);
      }
      if (filters.platform && filters.platform !== "all") {
        params.set("platform", filters.platform);
      }

      // Subject only for fresh_account (microjobs)
      if (
        filters.listingType === "fresh_account" &&
        filters.subject &&
        filters.subject !== "all"
      ) {
        params.set("subject", filters.subject);
      }

      // projectName and minPayRate only for already_onboarded (microjobs)
      if (filters.listingType === "already_onboarded") {
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

        {/* PATCH_17: Step indicator */}
        {step > 1 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
            <button
              type="button"
              onClick={() => {
                if (step === 3) handleBackToListingTypes();
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
                `${filters.category?.replace(/_/g, " ")} → ${filters.listingType?.replace(/_/g, " ")}`}
            </span>
          </div>
        )}
      </div>

      {/* PATCH_17: Step 1 - Category Selection */}
      {step === 1 && (
        <CategoryPicker
          selected={filters.category}
          onSelect={handleCategorySelect}
        />
      )}

      {/* PATCH_17: Step 2 - Listing Type Selection */}
      {step === 2 && (
        <ListingTypePicker
          category={filters.category}
          selected={filters.listingType}
          onSelect={handleListingTypeSelect}
          onBack={handleBackToCategories}
        />
      )}

      {/* PATCH_17: Step 3 - Filters + Results */}
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
              onBack={handleBackToListingTypes}
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
              {filtered.map((s) => (
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
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
