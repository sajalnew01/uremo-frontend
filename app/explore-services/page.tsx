"use client";

// PATCH_59: Unified Intent-Based Marketplace
// One page with 4 intent tabs: Buy, Earn, Rent, Deal
// Dynamic filters generated from Service collection
// Auto-synced with backend via /api/services/marketplace

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api";
import { onServicesRefresh } from "@/lib/events";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  useSiteSettings,
} from "@/hooks/useSiteSettings";
import TrustBadges from "@/components/TrustBadges";

// Intent Types
type Intent = "buy" | "earn" | "rent" | "deal";

// Service Type with unified fields
type Service = {
  _id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  subcategory?: string;
  countries?: string[];
  platform?: string;
  price: number;
  currency?: string;
  payRate?: number;
  imageUrl?: string;
  images?: string[];
  allowedActions?: {
    buy?: boolean;
    apply?: boolean;
    rent?: boolean;
    deal?: boolean;
  };
  linkedJob?: {
    _id: string;
    title: string;
    hasScreening?: boolean;
  };
  rentalPlans?: Array<{
    duration: number;
    unit: string;
    price: number;
    label?: string;
  }>;
  effectiveCategory?: string;
};

type FiltersState = {
  category: string;
  subcategory: string;
  country: string;
  search: string;
  minPrice: number;
  maxPrice: number;
  sort: string;
};

type FilterOptions = {
  categories: Array<{ id: string; label: string; subcategories?: string[] }>;
  countries: string[];
  platforms: string[];
  priceRange: { min: number; max: number };
};

type IntentCounts = {
  buy: number;
  earn: number;
  rent: number;
  deal: number;
};

// SVG Icons
function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// Intent Tab Configuration
const INTENT_CONFIG = {
  buy: {
    label: "Buy",
    icon: ShoppingBagIcon,
    color: "blue",
    gradient: "from-blue-500 to-indigo-600",
    bgGlow: "bg-blue-500/20",
    description: "Purchase accounts & services instantly",
    action: "Buy Now",
  },
  earn: {
    label: "Earn",
    icon: BriefcaseIcon,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-600",
    bgGlow: "bg-emerald-500/20",
    description: "Apply for jobs & start earning",
    action: "Apply Now",
  },
  rent: {
    label: "Rent",
    icon: KeyIcon,
    color: "purple",
    gradient: "from-purple-500 to-pink-600",
    bgGlow: "bg-purple-500/20",
    description: "Rent verified accounts monthly",
    action: "Rent Now",
  },
  deal: {
    label: "Deals",
    icon: ZapIcon,
    color: "orange",
    gradient: "from-orange-500 to-amber-600",
    bgGlow: "bg-orange-500/20",
    description: "Exclusive bulk & special offers",
    action: "Get Deal",
  },
};

export default function UnifiedMarketplacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: settings } = useSiteSettings();
  const { isAuthenticated } = useAuth();

  // URL-based intent selection
  const initialIntent = (searchParams.get("intent") as Intent) || "buy";
  const [activeIntent, setActiveIntent] = useState<Intent>(initialIntent);

  // State
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    countries: [],
    platforms: [],
    priceRange: { min: 0, max: 1000 },
  });
  const [intentCounts, setIntentCounts] = useState<IntentCounts>({
    buy: 0,
    earn: 0,
    rent: 0,
    deal: 0,
  });
  const [filters, setFilters] = useState<FiltersState>({
    category: "",
    subcategory: "",
    country: "",
    search: "",
    minPrice: 0,
    maxPrice: 0,
    sort: "relevance",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const servicesCopy =
    settings?.services?.list || DEFAULT_PUBLIC_SITE_SETTINGS.services.list;

  // Handle intent change
  const handleIntentChange = (intent: Intent) => {
    setActiveIntent(intent);
    setPage(1);
    // Update URL without full reload
    const url = new URL(window.location.href);
    url.searchParams.set("intent", intent);
    router.push(url.pathname + url.search, { scroll: false });
  };

  // Fetch marketplace data
  const loadMarketplace = useCallback(async () => {
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const params = new URLSearchParams();
      params.set("intent", activeIntent);
      params.set("limit", "24");
      params.set("page", String(page));

      if (filters.category) params.set("category", filters.category);
      if (filters.subcategory) params.set("subcategory", filters.subcategory);
      if (filters.country) params.set("country", filters.country);
      if (filters.search) params.set("search", filters.search);
      if (filters.minPrice > 0)
        params.set("minPrice", String(filters.minPrice));
      if (filters.maxPrice > 0)
        params.set("maxPrice", String(filters.maxPrice));
      if (filters.sort) params.set("sort", filters.sort);

      const res = await fetch(
        `${base}/api/services/marketplace?${params.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
        },
      );

      const data = await res
        .json()
        .catch(() => ({ services: [], filters: {}, intentCounts: {} }));

      if (data.ok) {
        setServices(data.services || []);
        setFilterOptions(data.filters || filterOptions);
        setIntentCounts(data.intentCounts || intentCounts);
        setTotalPages(data.meta?.pages || 1);
      } else {
        setServices([]);
      }
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [activeIntent, filters, page]);

  // Initial load and refresh
  useEffect(() => {
    loadMarketplace();
    const interval = setInterval(loadMarketplace, 30000);
    const cleanup = onServicesRefresh(() => loadMarketplace());
    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, [loadMarketplace]);

  // Client-side search filter
  const displayServices = useMemo(() => {
    if (!filters.search.trim()) return services;
    const q = filters.search.trim().toLowerCase();
    return services.filter((s) => {
      const hay =
        `${s.title || ""} ${s.category || ""} ${s.shortDescription || ""} ${s.description || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [services, filters.search]);

  const config = INTENT_CONFIG[activeIntent];
  const IconComponent = config.icon;

  return (
    <div className="u-container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Discover Services
            </h1>
            <p className="text-slate-400 max-w-xl">
              One marketplace for everything. Buy accounts, apply for jobs, rent
              verified profiles, or grab exclusive deals.
            </p>
          </div>
          <div className="hidden lg:block">
            <TrustBadges variant="horizontal" />
          </div>
        </div>
      </div>

      {/* Intent Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-800/50 rounded-2xl border border-white/10 backdrop-blur">
          {(Object.keys(INTENT_CONFIG) as Intent[]).map((intent) => {
            const cfg = INTENT_CONFIG[intent];
            const IntentIcon = cfg.icon;
            const isActive = activeIntent === intent;
            const count = intentCounts[intent] || 0;

            return (
              <button
                key={intent}
                onClick={() => handleIntentChange(intent)}
                className={`
                  relative flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300
                  ${
                    isActive
                      ? `bg-gradient-to-r ${cfg.gradient} text-white shadow-lg`
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <IntentIcon className="w-5 h-5" />
                <span>{cfg.label}</span>
                {count > 0 && (
                  <span
                    className={`
                    ml-1 px-2 py-0.5 text-xs rounded-full
                    ${isActive ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"}
                  `}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Intent Description */}
        <div
          className={`mt-4 p-4 rounded-xl border border-white/10 ${config.bgGlow} backdrop-blur`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}
            >
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {config.label} Services
              </h3>
              <p className="text-sm text-slate-300">{config.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            placeholder="Search services, platforms, categories..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            flex items-center gap-2 px-5 py-3 rounded-xl border transition-all
            ${
              showFilters
                ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                : "bg-slate-800/50 border-white/10 text-slate-400 hover:text-white"
            }
          `}
        >
          <FilterIcon className="w-5 h-5" />
          <span>Filters</span>
        </button>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
          className="px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none transition appearance-none cursor-pointer"
        >
          <option value="relevance">Most Relevant</option>
          <option value="newest">Newest First</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mb-6 p-5 rounded-2xl bg-slate-800/30 border border-white/10 backdrop-blur">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    category: e.target.value,
                    subcategory: "",
                  }))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none"
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            {filters.category && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Subcategory
                </label>
                <select
                  value={filters.subcategory}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, subcategory: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none"
                >
                  <option value="">All</option>
                  {filterOptions.categories
                    .find((c) => c.id === filters.category)
                    ?.subcategories?.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub.replace(/_/g, " ")}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Country */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Country
              </label>
              <select
                value={filters.country}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, country: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none"
              >
                <option value="">All Countries</option>
                {filterOptions.countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Price: ${filters.minPrice || filterOptions.priceRange.min} - $
                {filters.maxPrice || filterOptions.priceRange.max}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      minPrice: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-1/2 px-3 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      maxPrice: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-1/2 px-3 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() =>
                setFilters({
                  category: "",
                  subcategory: "",
                  country: "",
                  search: "",
                  minPrice: 0,
                  maxPrice: 0,
                  sort: "relevance",
                })
              }
              className="text-sm text-slate-400 hover:text-white transition"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
            <p className="text-slate-400">
              Loading {config.label.toLowerCase()} services...
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && displayServices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className={`w-20 h-20 rounded-full ${config.bgGlow} flex items-center justify-center mb-6`}
          >
            <IconComponent className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No {config.label} Services Found
          </h3>
          <p className="text-slate-400 max-w-md mb-6">
            {filters.search || filters.category
              ? "Try adjusting your filters or search query."
              : `There are no ${config.label.toLowerCase()} services available right now. Check back soon!`}
          </p>
          {(filters.search || filters.category) && (
            <button
              onClick={() =>
                setFilters({
                  category: "",
                  subcategory: "",
                  country: "",
                  search: "",
                  minPrice: 0,
                  maxPrice: 0,
                  sort: "relevance",
                })
              }
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Service Grid */}
      {!loading && displayServices.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayServices.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              intent={activeIntent}
              config={config}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          <span className="flex items-center px-4 text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Service Card Component
function ServiceCard({
  service,
  intent,
  config,
}: {
  service: Service;
  intent: Intent;
  config: typeof INTENT_CONFIG.buy;
}) {
  const hasLinkedJob = Boolean(service.linkedJob);
  const hasScreening = service.linkedJob?.hasScreening;

  // Determine the action link based on intent
  const getActionLink = () => {
    switch (intent) {
      case "earn":
        return service.linkedJob?._id
          ? `/apply-to-work?jobId=${service.linkedJob._id}`
          : `/apply-to-work?serviceId=${service._id}`;
      case "rent":
        return `/rentals/${service._id}`;
      case "deal":
        return `/deals/${service._id}`;
      default:
        return `/service/${service._id}`;
    }
  };

  // Get price display
  const getPriceDisplay = () => {
    if (intent === "earn" && service.payRate) {
      return `$${service.payRate}/hr`;
    }
    if (intent === "rent" && service.rentalPlans?.length) {
      const cheapest = service.rentalPlans.reduce(
        (min, p) => (p.price < min.price ? p : min),
        service.rentalPlans[0],
      );
      return `$${cheapest.price}/${cheapest.unit === "days" ? `${cheapest.duration}d` : `${cheapest.duration}mo`}`;
    }
    return `$${service.price}`;
  };

  return (
    <Link
      href={getActionLink()}
      className="group relative flex flex-col bg-slate-800/30 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:shadow-xl transition-all duration-300"
    >
      {/* Hover Glow Effect */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${config.bgGlow} blur-xl`}
      />

      {/* Image */}
      <div className="relative aspect-[4/3] bg-slate-900/50 overflow-hidden">
        {service.imageUrl || service.images?.[0] ? (
          <img
            src={service.imageUrl || service.images?.[0]}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className={`p-4 rounded-full ${config.bgGlow}`}>
              {config.icon({ className: "w-8 h-8 text-slate-500" })}
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-black/50 backdrop-blur text-white border border-white/20">
            {service.category?.replace(/_/g, " ") || "Service"}
          </span>
        </div>

        {/* Intent-specific badges */}
        {intent === "earn" && hasScreening && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 backdrop-blur text-emerald-300 border border-emerald-500/30">
              Screening
            </span>
          </div>
        )}

        {intent === "rent" && service.rentalPlans?.length && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-500/20 backdrop-blur text-purple-300 border border-purple-500/30">
              {service.rentalPlans.length} Plans
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col p-4">
        <h3 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-slate-100">
          {service.title}
        </h3>

        {service.shortDescription && (
          <p className="text-sm text-slate-400 line-clamp-2 mb-3 flex-1">
            {service.shortDescription}
          </p>
        )}

        {/* Countries */}
        {service.countries && service.countries.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {service.countries.slice(0, 3).map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 text-xs rounded-full bg-slate-700/50 text-slate-300"
              >
                {c}
              </span>
            ))}
            {service.countries.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700/50 text-slate-400">
                +{service.countries.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
          <span className="text-lg font-bold text-white">
            {getPriceDisplay()}
          </span>
          <span
            className={`
            flex items-center gap-1 text-sm font-medium
            bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent
            group-hover:scale-105 transition-transform
          `}
          >
            {config.action}
            <span className="text-slate-400 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </span>
        </div>
      </div>

      {/* Intent-specific footer badges */}
      {intent === "earn" && hasLinkedJob && (
        <div className="px-4 py-2 bg-emerald-500/10 border-t border-emerald-500/20">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircleIcon className="w-4 h-4" />
            <span>Direct job application available</span>
          </div>
        </div>
      )}
    </Link>
  );
}
