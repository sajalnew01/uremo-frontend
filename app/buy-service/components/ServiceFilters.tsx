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
  filtersConfig: {
    categories: Array<{ id: string; label: string }>;
    countries: string[];
    serviceTypes: Array<{ id: string; label: string }>;
  };
  value: {
    category: string;
    country: string;
    serviceType: string;
    sort: string;
  };
  onChange: (next: {
    category: string;
    country: string;
    serviceType: string;
    sort: string;
  }) => void;
  onRefresh: () => void;
  loading?: boolean;
};

export default function ServiceFilters({
  filtersConfig,
  value,
  onChange,
  onRefresh,
  loading,
}: ServiceFiltersProps) {
  const countries =
    Array.isArray(filtersConfig?.countries) && filtersConfig.countries.length
      ? filtersConfig.countries
      : ["Global"];

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Category Filter */}
      <select
        value={value.category}
        onChange={(e) => onChange({ ...value, category: e.target.value })}
        className="u-select min-w-[160px]"
      >
        <option value="all">All Categories</option>
        {(filtersConfig?.categories || []).map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.label}
          </option>
        ))}
      </select>

      {/* Country Filter */}
      <select
        value={value.country}
        onChange={(e) => onChange({ ...value, country: e.target.value })}
        className="u-select min-w-[140px]"
      >
        <option value="all">All Countries</option>
        {countries.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>

      {/* Service Type Filter */}
      <select
        value={value.serviceType}
        onChange={(e) => onChange({ ...value, serviceType: e.target.value })}
        className="u-select min-w-[160px]"
      >
        <option value="all">All Types</option>
        {(filtersConfig?.serviceTypes || []).map((type) => (
          <option key={type.id} value={type.id}>
            {type.label}
          </option>
        ))}
      </select>

      {/* Sort Filter */}
      <select
        value={value.sort}
        onChange={(e) => onChange({ ...value, sort: e.target.value })}
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
