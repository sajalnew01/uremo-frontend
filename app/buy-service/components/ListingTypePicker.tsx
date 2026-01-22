"use client";

// PATCH_19: Subcategory Picker - shows different options per category

type SubcategoryOption = {
  id: string;
  label: string;
  description: string;
  icon: string;
  badge?: string;
};

// Subcategories per category - MUST match backend Service.js
const SUBCATEGORIES_BY_CATEGORY: Record<string, SubcategoryOption[]> = {
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
      label: "Forex Platform Creation",
      description: "Full setup and verification for forex trading platforms.",
      icon: "📊",
      badge: "Trading",
    },
    {
      id: "crypto_platform_creation",
      label: "Crypto Platform Creation",
      description: "Crypto exchange account setup and KYC verification.",
      icon: "🪙",
      badge: "Crypto",
    },
  ],
  banks_gateways_wallets: [
    {
      id: "banks",
      label: "Bank Accounts",
      description: "Traditional bank account setup and verification services.",
      icon: "🏦",
      badge: "Banking",
    },
    {
      id: "payment_gateways",
      label: "Payment Gateways",
      description: "Stripe, PayPal, and other payment processor accounts.",
      icon: "💳",
      badge: "Payments",
    },
    {
      id: "wallets",
      label: "Digital Wallets",
      description: "E-wallet and mobile money account services.",
      icon: "👝",
      badge: "Wallets",
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

  // Get subcategories for the selected category
  const subcategories =
    SUBCATEGORIES_BY_CATEGORY[category] || SUBCATEGORIES_BY_CATEGORY.microjobs;

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

      <div
        className={`grid grid-cols-1 ${subcategories.length <= 2 ? "md:grid-cols-2" : "md:grid-cols-3"} gap-6 max-w-4xl mx-auto`}
      >
        {subcategories.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type.id)}
            className={`group relative p-8 rounded-2xl border text-left transition-all duration-300 ${
              selected === type.id
                ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            {/* Badge */}
            {type.badge && (
              <div className="absolute top-4 right-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    type.id === "already_onboarded"
                      ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}
                >
                  {type.badge}
                </span>
              </div>
            )}

            {/* Selected indicator */}
            {selected === type.id && (
              <div className="absolute top-4 left-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                  ✓
                </span>
              </div>
            )}

            <div className="text-4xl mb-4">{type.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-300 transition">
              {type.label}
            </h3>
            <p className="text-sm text-slate-400">{type.description}</p>
          </button>
        ))}
      </div>

      {/* Selection info */}
      {selected && (
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Selected:{" "}
            <span className="text-white font-medium">
              {subcategories.find((t) => t.id === selected)?.label}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
