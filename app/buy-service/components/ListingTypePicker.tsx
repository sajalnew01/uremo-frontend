"use client";

// PATCH_19: Subcategory Picker for Step 2 of Buy Service 3-step flow
// Each category has its OWN subcategories (not universal fresh_account/already_onboarded)

type Subcategory = {
  id: string;
  label: string;
  description: string;
  icon: string;
  badge?: string;
};

// PATCH_19: Category-specific subcategories
const SUBCATEGORIES_BY_CATEGORY: Record<string, Subcategory[]> = {
  microjobs: [
    {
      id: "fresh_account",
      label: "Fresh Account",
      description:
        "Apply fresh with screening assessment. Get verified accounts ready for onboarding.",
      icon: "🆕",
      badge: "With Screening",
    },
    {
      id: "already_onboarded",
      label: "Already Onboarded",
      description: "Instant project-ready accounts. Start earning immediately.",
      icon: "⚡",
      badge: "Instant",
    },
  ],
  forex_crypto: [
    {
      id: "forex_platform_creation",
      label: "Forex Trading Platform Creation Assistance",
      description:
        "Get help setting up forex trading platform accounts with proper verification.",
      icon: "📊",
      badge: "Forex",
    },
    {
      id: "crypto_platform_creation",
      label: "Crypto Platform Creation Assistance",
      description:
        "Assistance with cryptocurrency exchange and wallet account setup.",
      icon: "🪙",
      badge: "Crypto",
    },
  ],
  banks_gateways_wallets: [
    {
      id: "banks",
      label: "Banks",
      description:
        "Traditional bank account setup and verification assistance.",
      icon: "🏦",
      badge: "Banking",
    },
    {
      id: "payment_gateways",
      label: "Payment Gateways",
      description:
        "Payment processor accounts like Stripe, PayPal, Payoneer setup.",
      icon: "💳",
      badge: "Payments",
    },
    {
      id: "wallets",
      label: "Wallets",
      description: "Digital wallet and e-wallet account creation assistance.",
      icon: "👛",
      badge: "E-Wallets",
    },
  ],
};

type ListingTypePickerProps = {
  category: string;
  selected: string | null;
  onSelect: (subcategoryId: string) => void;
  onBack: () => void;
};

export default function ListingTypePicker({
  category,
  selected,
  onSelect,
  onBack,
}: ListingTypePickerProps) {
  // Get category label for display
  const getCategoryLabel = (id: string) => {
    const labels: Record<string, string> = {
      microjobs: "Microjobs",
      forex_crypto: "Forex / Crypto",
      banks_gateways_wallets: "Banks / Gateways / Wallets",
    };
    return labels[id] || id;
  };

  // PATCH_19: Get subcategories for the selected category
  const subcategories = SUBCATEGORIES_BY_CATEGORY[category] || [];

  // Determine grid columns based on number of subcategories
  const gridCols =
    subcategories.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2";

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
      >
        <span>←</span>
        <span>Back to Categories</span>
      </button>

      <div className="text-center mb-6">
        <div className="mb-2">
          <span className="inline-block px-3 py-1 text-xs rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300">
            {getCategoryLabel(category)}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose Subcategory
        </h2>
        <p className="text-slate-400 text-sm">
          Select the type of service you need
        </p>
      </div>

      <div className={`grid grid-cols-1 ${gridCols} gap-6 max-w-4xl mx-auto`}>
        {subcategories.map((sub) => (
          <button
            key={sub.id}
            type="button"
            onClick={() => onSelect(sub.id)}
            className={`group relative p-8 rounded-2xl border text-left transition-all duration-300 ${
              selected === sub.id
                ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            {/* Badge */}
            {sub.badge && (
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {sub.badge}
                </span>
              </div>
            )}

            {/* Selected indicator */}
            {selected === sub.id && (
              <div className="absolute top-4 left-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                  ✓
                </span>
              </div>
            )}

            <div className="text-4xl mb-4">{sub.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-300 transition">
              {sub.label}
            </h3>
            <p className="text-sm text-slate-400">{sub.description}</p>
          </button>
        ))}
      </div>

      {/* Selection info */}
      {selected && (
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Selected:{" "}
            <span className="text-white font-medium">
              {subcategories.find((s) => s.id === selected)?.label}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
