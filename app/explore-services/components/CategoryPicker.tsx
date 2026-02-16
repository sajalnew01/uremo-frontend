"use client";

// PATCH_17/21: Category Picker for Step 1 of Buy Service 3-step flow

type Category = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

const CATEGORIES: Category[] = [
  {
    id: "microjobs",
    label: "Microjobs",
    description: "AI training, data annotation, and freelance platform gigs",
    icon: "Work",
  },
  {
    id: "forex_crypto",
    label: "Forex / Crypto",
    description: "Trading platforms, exchanges, and crypto wallet accounts",
    icon: "Trade",
  },
  {
    id: "banks_gateways_wallets",
    label: "Banks / Gateways / Wallets",
    description: "Payment gateways, bank accounts, and e-wallet services",
    icon: "Bank",
  },
  // PATCH_21: Rentals category for account rental services
  {
    id: "rentals",
    label: "Rentals",
    description:
      "Rent verified accounts: WhatsApp Business, LinkedIn Premium, and more",
    icon: "Rent",
  },
];

type CategoryPickerProps = {
  selected: string | null;
  onSelect: (categoryId: string) => void;
};

export default function CategoryPicker({
  selected,
  onSelect,
}: CategoryPickerProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Choose a Category
        </h2>
        <p className="text-slate-400 text-sm">
          Select the type of service you're looking for
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`group relative p-6 rounded-2xl border text-left transition-all duration-300 ${
              selected === cat.id
                ? "border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            {/* Selected indicator */}
            {selected === cat.id && (
              <div className="absolute top-3 right-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs">
                  ✓
                </span>
              </div>
            )}

            <div className="text-3xl mb-3">{cat.icon}</div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition">
              {cat.label}
            </h3>
            <p className="text-sm text-slate-400 line-clamp-2">
              {cat.description}
            </p>
          </button>
        ))}
      </div>

      {/* Continue button */}
      {selected && (
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Selected:{" "}
            <span className="text-white font-medium">
              {CATEGORIES.find((c) => c.id === selected)?.label}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
