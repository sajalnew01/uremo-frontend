"use client";

// PATCH_15: Inline RefreshCw icon to avoid lucide-react dependency
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

type ServiceFiltersProps = {
  filters: {
    category: string;
    country: string;
    serviceType: string;
    sort: string;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      category: string;
      country: string;
      serviceType: string;
      sort: string;
    }>
  >;
  availableCategories: string[];
  availableCountries: string[];
  availableServiceTypes: string[];
  onRefresh: () => void;
  loading?: boolean;
};

export default function ServiceFilters({
  filters,
  setFilters,
  availableCategories,
  availableCountries,
  availableServiceTypes,
  onRefresh,
  loading,
}: ServiceFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Category Filter */}
      <select
        value={filters.category}
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, category: e.target.value }))
        }
        className="u-select min-w-[160px]"
      >
        <option value="all">All Categories</option>
        {availableCategories.map((cat) => (
          <option key={cat} value={cat}>
            {cat.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      {/* Country Filter */}
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

      {/* Service Type Filter */}
      <select
        value={filters.serviceType}
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, serviceType: e.target.value }))
        }
        className="u-select min-w-[160px]"
      >
        <option value="all">All Types</option>
        {availableServiceTypes.map((type) => (
          <option key={type} value={type}>
            {type.replace(/_/g, " ")}
          </option>
        ))}
      </select>

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
  );
}
