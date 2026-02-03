"use client";

/**
 * PATCH_55: Sticky Action Bar Component
 *
 * Shows a sticky bottom bar when user scrolls down.
 * Works on both desktop and mobile.
 */

import { useEffect, useState } from "react";

type StickyActionBarProps = {
  serviceTitle: string;
  price: number;
  payRate?: number;
  allowedActions: {
    buy: boolean;
    apply: boolean;
    rent: boolean;
    deal: boolean;
  };
  rentalPlans?: Array<{ label: string; price: number }>;
  selectedRentalPlan: number | null;
  isActive?: boolean;
  onBuy: () => void;
  onApply: () => void;
  onRent: () => void;
  onDeal: () => void;
  onHelp: () => void;
};

export default function StickyActionBar({
  serviceTitle,
  price,
  payRate,
  allowedActions,
  rentalPlans = [],
  selectedRentalPlan,
  isActive = true,
  onBuy,
  onApply,
  onRent,
  onDeal,
  onHelp,
}: StickyActionBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    "buy" | "apply" | "rent" | "deal" | null
  >(null);

  // Determine primary action
  useEffect(() => {
    if (allowedActions.buy) setSelectedAction("buy");
    else if (allowedActions.apply) setSelectedAction("apply");
    else if (allowedActions.rent) setSelectedAction("rent");
    else if (allowedActions.deal) setSelectedAction("deal");
  }, [allowedActions]);

  // Show bar when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const hasAnyAction =
    allowedActions.buy ||
    allowedActions.apply ||
    allowedActions.rent ||
    allowedActions.deal;

  if (!hasAnyAction) return null;

  // Get action config
  const actionConfigs = {
    buy: {
      label: `Buy Now – $${price}`,
      gradient: "from-blue-500 to-indigo-600",
      onClick: onBuy,
    },
    apply: {
      label: payRate ? `Apply & Earn $${payRate}/hr` : "Apply to Work",
      gradient: "from-emerald-500 to-teal-600",
      onClick: onApply,
    },
    rent: {
      label:
        selectedRentalPlan !== null && rentalPlans[selectedRentalPlan]
          ? `Rent for $${rentalPlans[selectedRentalPlan].price}`
          : "Select Rental Plan",
      gradient: "from-purple-500 to-pink-600",
      onClick: onRent,
    },
    deal: {
      label: "Start Deal",
      gradient: "from-orange-500 to-amber-600",
      onClick: onDeal,
    },
  };

  const currentAction = selectedAction ? actionConfigs[selectedAction] : null;

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        transition-transform duration-300 ease-out
        ${isVisible ? "translate-y-0" : "translate-y-full"}
      `}
    >
      {/* Gradient border top */}
      <div className="h-px bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />

      {/* Bar content */}
      <div className="bg-slate-950/95 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Service Info */}
            <div className="flex-1 min-w-0 hidden sm:block">
              <p className="text-white font-semibold truncate text-sm">
                {serviceTitle}
              </p>
              <p className="text-emerald-400 font-bold text-lg">${price}</p>
            </div>

            {/* Center: Action Selector (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              {allowedActions.buy && (
                <button
                  type="button"
                  onClick={() => setSelectedAction("buy")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedAction === "buy"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Buy
                </button>
              )}
              {allowedActions.apply && (
                <button
                  type="button"
                  onClick={() => setSelectedAction("apply")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedAction === "apply"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Apply
                </button>
              )}
              {allowedActions.rent && (
                <button
                  type="button"
                  onClick={() => setSelectedAction("rent")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedAction === "rent"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Rent
                </button>
              )}
              {allowedActions.deal && (
                <button
                  type="button"
                  onClick={() => setSelectedAction("deal")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedAction === "deal"
                      ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Deal
                </button>
              )}
            </div>

            {/* Right: CTA Button */}
            <div className="flex items-center gap-3">
              {/* Help Button */}
              <button
                type="button"
                onClick={onHelp}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all text-sm"
              >
                <span>💬</span>
                <span className="hidden lg:inline">Need help?</span>
              </button>

              {/* Primary CTA */}
              {currentAction && (
                <button
                  type="button"
                  onClick={currentAction.onClick}
                  disabled={
                    !isActive ||
                    (selectedAction === "rent" && selectedRentalPlan === null)
                  }
                  className={`
                    px-6 py-3 rounded-xl font-bold text-white text-sm
                    bg-gradient-to-r ${currentAction.gradient}
                    transition-all duration-300
                    ${
                      isActive
                        ? "hover:shadow-[0_0_24px_rgba(59,130,246,0.4)] hover:scale-105 active:scale-95"
                        : "opacity-50 cursor-not-allowed"
                    }
                  `}
                >
                  {isActive ? currentAction.label : "Unavailable"}
                </button>
              )}
            </div>
          </div>

          {/* Mobile: Price (shown on mobile) */}
          <div className="sm:hidden mt-2 text-center">
            <p className="text-slate-400 text-xs truncate">{serviceTitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
