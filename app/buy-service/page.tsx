"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";
import Link from "next/link";
import { withCacheBust } from "@/lib/cacheBust";
import { useAuth } from "@/hooks/useAuth";
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  useSiteSettings,
} from "@/hooks/useSiteSettings";
import ServiceFilters from "./components/ServiceFilters";

type Service = {
  _id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  serviceType?: string;
  countries?: string[];
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
  country: string;
  serviceType: string;
  sort: string;
};

export default function BuyServicePage() {
  const { data: settings } = useSiteSettings();
  const { ready: authReady, isAuthenticated } = useAuth();
  const servicesCopy =
    settings?.services?.list || DEFAULT_PUBLIC_SITE_SETTINGS.services.list;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // PATCH_15: Vision-aligned filters
  const [filters, setFilters] = useState<FiltersState>({
    category: "all",
    country: "all",
    serviceType: "all",
    sort: "createdAt",
  });

  // PATCH_15: Available filter options from API
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>(
    [],
  );

  const introText =
    (settings?.services?.trustBlockText || "").trim() ||
    DEFAULT_PUBLIC_SITE_SETTINGS.services.trustBlockText;

  // PATCH_15: Wait for auth to be ready before determining href.
  // If authenticated, go to buy-service (stay here). If not, go to signup.
  const getStartedHref = authReady
    ? isAuthenticated
      ? "/buy-service"
      : "/signup"
    : "/buy-service";

  // PATCH_15: Fetch services with filters from MongoDB
  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const params = new URLSearchParams({
        status: "active",
        limit: "100",
        category: filters.category,
        country: filters.country,
        serviceType: filters.serviceType,
        sort: filters.sort,
      });

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

      // PATCH_16: Update available filters from API response (canonical config)
      if (data?.filters) {
        // Use canonical categories with id/label if available, fallback to legacy
        if (Array.isArray(data.filters.categories)) {
          setAvailableCategories(
            data.filters.categories.map((c: any) => c.id || c),
          );
        } else if (Array.isArray(data.filters.availableCategories)) {
          setAvailableCategories(data.filters.availableCategories);
        }
        // Use canonical countries (normalized list from backend)
        if (Array.isArray(data.filters.countries)) {
          setAvailableCountries(data.filters.countries);
        } else if (Array.isArray(data.filters.availableCountries)) {
          setAvailableCountries(data.filters.availableCountries);
        }
        // Use canonical service types
        if (Array.isArray(data.filters.serviceTypes)) {
          setAvailableServiceTypes(
            data.filters.serviceTypes
              .filter((t: any) => (t.id || t) !== "all")
              .map((t: any) => t.id || t),
          );
        } else if (Array.isArray(data.filters.availableServiceTypes)) {
          setAvailableServiceTypes(data.filters.availableServiceTypes);
        }
      }
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

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

        {/* PATCH_15: Vision-aligned filter controls */}
        <div className="mt-6 space-y-4">
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
            availableCategories={availableCategories}
            availableCountries={availableCountries}
            availableServiceTypes={availableServiceTypes}
            onRefresh={loadServices}
            loading={loading}
          />
        </div>
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
          <h3 className="text-lg font-semibold">{servicesCopy.emptyTitle}</h3>
          <p className="text-sm text-slate-300 mt-2">
            {servicesCopy.emptySubtitle}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilters({
                  category: "all",
                  country: "all",
                  serviceType: "all",
                  sort: "createdAt",
                });
              }}
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
                    {s.imageUrl || (Array.isArray(s.images) && s.images[0]) ? (
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
                          {s.category}
                        </span>
                      )}
                      {s.deliveryType && (
                        <span className="u-pill text-slate-200">
                          {String(s.deliveryType).replace(/_/g, " ")}
                        </span>
                      )}
                      {s.active === false && (
                        <span className="u-pill text-slate-200">
                          {servicesCopy.inactiveBadgeText}
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
    </div>
  );
}
