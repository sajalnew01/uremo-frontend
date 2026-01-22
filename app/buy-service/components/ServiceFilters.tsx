"use client";

// PATCH_17: Dynamic filters based on listingType for 3-step flow

// Inline RefreshCw icon to avoid lucide-react dependency
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

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

type ServiceFiltersProps = {
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
  availableCountries: string[];
  availablePlatforms: string[];
  availableSubjects: string[];
  availableProjects: string[];
  payRateRange: { min: number; max: number };
  onRefresh: () => void;
  onBack: () => void;
  loading?: boolean;
};

export default function ServiceFilters({
  filters,
  setFilters,
  availableCountries,
  availablePlatforms,
  availableSubjects,
  availableProjects,
  payRateRange,
  onRefresh,
  onBack,
  loading,
}: ServiceFiltersProps) {
  const isFreshAccount = filters.listingType === "fresh_account";
  const isAlreadyOnboarded = filters.listingType === "already_onboarded";

  // Get category and listing type labels for display
  const getCategoryLabel = (id: string) => {
    const labels: Record<string, string> = {
      microjobs: "Microjobs",
      forex_crypto: "Forex / Crypto",
      banks_gateways_wallets: "Banks / Gateways / Wallets",
    };
    return labels[id] || id;
  };

  const getListingTypeLabel = (id: string) => {
    const labels: Record<string, string> = {
      fresh_account: "Fresh Account",
      already_onboarded: "Already Onboarded",
    };
    return labels[id] || id;
  };

  return (
    <div className="space-y-4">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <span>←</span>
          <span>Change Selection</span>
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
            {getCategoryLabel(filters.category)}
          </span>
          <span className="text-slate-500">→</span>
          <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            {getListingTypeLabel(filters.listingType)}
          </span>
        </div>
      </div>

      {/* Dynamic filters based on listing type */}
      <div className="flex flex-wrap gap-3 items-center p-4 rounded-xl border border-white/10 bg-white/5">
        {/* PATCH_18: Country Filter - Only show if countries available */}
        {availableCountries.length > 0 && (
          <select
            value={filters.country}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, country: e.target.value }))
            }
            className="u-select min-w-[140px]"
          >
            <option value="all">All Countries</option>
            {availableCountries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        )}

        {/* PATCH_18: Platform Filter - Only show if platforms available */}
        {availablePlatforms.length > 0 && (
          <select
            value={filters.platform}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, platform: e.target.value }))
            }
            className="u-select min-w-[140px]"
          >
            <option value="all">All Platforms</option>
            {availablePlatforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        )}

        {/* PATCH_18: Subject Filter - Only for fresh_account AND only if subjects available */}
        {isFreshAccount && availableSubjects.length > 0 && (
          <select
            value={filters.subject}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, subject: e.target.value }))
            }
            className="u-select min-w-[140px]"
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        )}

        {/* PATCH_18: Project Filter - Only for already_onboarded AND only if projects available */}
        {isAlreadyOnboarded && availableProjects.length > 0 && (
          <select
            value={filters.projectName}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, projectName: e.target.value }))
            }
            className="u-select min-w-[140px]"
          >
            <option value="all">All Projects</option>
            {availableProjects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        )}

        {/* PATCH_18: Min Pay Rate Filter - Only for already_onboarded */}
        {isAlreadyOnboarded && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Min Pay:</label>
            <input
              type="number"
              min={0}
              max={payRateRange.max}
              step={5}
              value={filters.minPayRate || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  minPayRate: Number(e.target.value) || 0,
                }))
              }
              placeholder="$0"
              className="u-input w-20 text-sm"
            />
          </div>
        )}

        {/* Sort Filter */}
        <select
          value={filters.sort}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, sort: e.target.value }))
          }
          className="u-select min-w-[140px]"
        >
          <option value="createdAt">Newest</option>
          <option value="topViewed">Most Viewed</option>
          <option value="priceLow">Price: Low to High</option>
          <option value="priceHigh">Price: High to Low</option>
          {isAlreadyOnboarded && (
            <option value="payRateHigh">Pay Rate: High to Low</option>
          )}
        </select>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-sm transition disabled:opacity-50"
        >
          <RefreshIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>
  );
}
