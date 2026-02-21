"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { useUIStore } from "@/store";
import { ServiceCard } from "@/components";
import { IntentTabs } from "@/design-system";
import type { Service, Intent } from "@/types";

interface MarketplaceResponse {
  services: Service[];
  total: number;
  page: number;
  totalPages: number;
  filters?: {
    categories: string[];
    countries: string[];
    intents: string[];
  };
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { intent, setIntent } = useUIStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // Sync intent from URL on mount
  useEffect(() => {
    const urlIntent = searchParams.get("intent") as Intent | null;
    if (urlIntent && ["all", "buy", "earn", "rent", "deal"].includes(urlIntent)) {
      setIntent(urlIntent);
    }
  }, [searchParams, setIntent]);

  // Sync intent from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("uremo_explore_intent") as Intent | null;
      if (stored) setIntent(stored);
    }
  }, [setIntent]);

  const handleIntentChange = useCallback(
    (newIntent: Intent) => {
      setIntent(newIntent);
      setPage(1);
      const params = new URLSearchParams();
      if (newIntent !== "all") params.set("intent", newIntent);
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      router.replace(`/explore?${params.toString()}`);
    },
    [setIntent, router, search, category]
  );

  const queryString = (() => {
    const params = new URLSearchParams();
    if (intent !== "all") params.set("intent", intent);
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    params.set("page", String(page));
    return params.toString();
  })();

  const { data, isLoading, error } = useQuery<MarketplaceResponse>({
    queryKey: ["marketplace", intent, page, search, category],
    queryFn: () => apiRequest(`${EP.SERVICES_MARKETPLACE}?${queryString}`),
  });

  const { data: filtersData } = useQuery<{ categories: string[]; countries: string[] }>({
    queryKey: ["marketplace-filters"],
    queryFn: () => apiRequest(EP.SERVICES_MARKETPLACE_FILTERS),
    staleTime: 60_000,
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Explore Services</h1>
        <p className="page-subtitle">Discover services — buy, earn, rent, or find deals.</p>
      </div>

      {/* Intent Tabs */}
      <IntentTabs
        active={intent}
        onChange={(i) => handleIntentChange(i)}
      />

      {/* Search & Filters */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
        <input
          className="u-input"
          placeholder="Search services..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 320 }}
        />
        {filtersData?.categories && (
          <select
            className="u-input"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            style={{ maxWidth: 200 }}
          >
            <option value="">All Categories</option>
            {filtersData.categories.map((cat) => (
              <option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>
            ))}
          </select>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="page-loading">
          <div className="u-spinner" /> Loading services...
        </div>
      ) : error ? (
        <div className="page-empty">Failed to load services. Please try again.</div>
      ) : !data?.services?.length ? (
        <div className="page-empty">
          No services found{intent !== "all" ? ` for "${intent}"` : ""}. Try a different filter.
        </div>
      ) : (
        <>
          <div className="u-grid u-grid-3" style={{ marginBottom: "var(--space-6)" }}>
            {data.services.map((svc) => (
              <ServiceCard key={svc._id} service={svc} />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-2)" }}>
              <button
                className="u-btn u-btn-secondary u-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span style={{ display: "flex", alignItems: "center", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                Page {data.page} of {data.totalPages}
              </span>
              <button
                className="u-btn u-btn-secondary u-btn-sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
