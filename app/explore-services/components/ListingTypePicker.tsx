"use client";

// PATCH_19: Subcategory Picker for Step 2 of Buy Service 3-step flow
// Now shows correct subcategories based on selected category

type SubcategoryItem = {
  id: string;
  label: string;
  description: string;
  icon: string;
  badge?: string;
};

// PATCH_19/21: Subcategories mapped by category
const SUBCATEGORIES_BY_CATEGORY: Record<string, SubcategoryItem[]> = {
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
        "Get help setting up verified forex trading accounts on major platforms.",
      icon: "Trade",
      badge: "Trading",
    },
    {
      id: "crypto_platform_creation",
      label: "Crypto Platform Creation Assistance",
      description:
        "Assistance with crypto exchange account creation and verification.",
      icon: "Coin",
      badge: "Crypto",
    },
  ],
  banks_gateways_wallets: [
    {
      id: "banks",
      label: "Banks",
      description: "Bank account creation and verification assistance.",
      icon: "Bank",
      badge: "Banking",
    },
    {
      id: "payment_gateways",
      label: "Payment Gateways",
      description:
        "Payment gateway accounts like PayPal, Stripe, Payoneer setup help.",
      icon: "Pay",
      badge: "Payments",
    },
    {
      id: "wallets",
      label: "Wallets",
      description: "E-wallet and digital wallet creation assistance.",
      icon: "Wallet",
      badge: "E-Wallets",
    },
  ],
  // PATCH_21: Rental subcategories
  rentals: [
    {
      id: "whatsapp_business_verified",
      label: "WhatsApp Business (Meta Verified)",
      description:
        "Rent Meta-verified WhatsApp Business accounts for marketing and customer engagement.",
      icon: "WA",
      badge: "Verified",
    },
    {
      id: "linkedin_premium_account",
      label: "LinkedIn Premium Account",
      description:
        "Access LinkedIn Premium features with good connection accounts for networking and leads.",
      icon: "LI",
      badge: "Premium",
    },
    {
      id: "social_media_verified",
      label: "Social Media Verified Accounts",
      description:
        "Rent verified social media accounts (Twitter, Instagram, Facebook) with badges.",
      icon: "OK",
      badge: "Social",
    },
    {
      id: "email_accounts",
      label: "Email Accounts (Aged/Verified)",
      description:
        "Rent aged and verified email accounts for marketing campaigns and business use.",
      icon: "Mail",
      badge: "Email",
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
  // PATCH_21: Get category label for display
  const getCategoryLabel = (id: string) => {
    const labels: Record<string, string> = {
      microjobs: "Microjobs",
      forex_crypto: "Forex / Crypto",
      banks_gateways_wallets: "Banks / Gateways / Wallets",
      rentals: "Rentals",
    };
    return labels[id] || id;
  };

  // PATCH_19: Get subcategories for the selected category
  const subcategories = SUBCATEGORIES_BY_CATEGORY[category] || [];

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
        className={`grid grid-cols-1 ${subcategories.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"} gap-6 max-w-4xl mx-auto`}
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
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-300 transition">
              {type.label}
            </h3>
            <p className="text-sm text-slate-400 line-clamp-3">
              {type.description}
            </p>
          </button>
        ))}
      </div>

      {/* No subcategories fallback */}
      {subcategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">
            No subcategories available for this category.
          </p>
          <button type="button" onClick={onBack} className="mt-4 btn-secondary">
            Choose a different category
          </button>
        </div>
      )}

      {/* Continue hint */}
      {selected && (
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Selected:{" "}
            <span className="text-white font-medium">
              {subcategories.find((c) => c.id === selected)?.label}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
