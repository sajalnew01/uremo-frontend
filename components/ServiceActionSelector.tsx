"use client";

/**
 * PATCH_55: Service Action Selector Component
 *
 * Displays all allowed actions for a service with clear explanations
 * and CTAs. Highlights the action matching user's intent from URL.
 */

import { useSearchParams } from "next/navigation";

type AllowedActions = {
  buy: boolean;
  apply: boolean;
  rent: boolean;
  deal: boolean;
};

type RentalPlan = {
  label: string;
  duration: number;
  unit: string;
  price: number;
  isPopular?: boolean;
};

type ServiceActionSelectorProps = {
  price: number;
  payRate?: number;
  allowedActions: AllowedActions;
  rentalPlans?: RentalPlan[];
  isRental?: boolean;
  isActive?: boolean;
  onBuy: () => void;
  onApply: () => void;
  onRent: (planIndex: number) => void;
  onDeal: () => void;
  selectedRentalPlan: number | null;
  onSelectRentalPlan: (index: number) => void;
};

// Action card configurations
const ACTION_CONFIG = {
  buy: {
    icon: "🛒",
    title: "Buy & Use Instantly",
    bullets: [
      "One-time purchase",
      "Admin-verified delivery",
      "Typical delivery: 24–48 hrs",
    ],
    gradient: "from-blue-500 to-indigo-600",
    bgGlow: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    highlightBorder: "border-blue-500",
    highlightGlow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]",
  },
  apply: {
    icon: "💼",
    title: "Apply & Earn",
    bullets: [
      "Pass screening test",
      "Get assigned real projects",
      "Earn per task completed",
    ],
    gradient: "from-emerald-500 to-teal-600",
    bgGlow: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    highlightBorder: "border-emerald-500",
    highlightGlow: "shadow-[0_0_30px_rgba(16,185,129,0.3)]",
  },
  rent: {
    icon: "🔑",
    title: "Rent Access",
    bullets: ["Weekly / Monthly access", "Managed usage", "Cancel anytime"],
    gradient: "from-purple-500 to-pink-600",
    bgGlow: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    highlightBorder: "border-purple-500",
    highlightGlow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]",
  },
  deal: {
    icon: "🤝",
    title: "Deal at Percentage",
    bullets: [
      "Complete tasks together",
      "Earn commission %",
      "Admin verified payout",
    ],
    gradient: "from-orange-500 to-amber-600",
    bgGlow: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    highlightBorder: "border-orange-500",
    highlightGlow: "shadow-[0_0_30px_rgba(249,115,22,0.3)]",
  },
};

// Map URL intent to action key
const INTENT_TO_ACTION: Record<string, keyof typeof ACTION_CONFIG> = {
  buy: "buy",
  earn: "apply",
  rent: "rent",
  deal: "deal",
};

export default function ServiceActionSelector({
  price,
  payRate,
  allowedActions,
  rentalPlans = [],
  isRental,
  isActive = true,
  onBuy,
  onApply,
  onRent,
  onDeal,
  selectedRentalPlan,
  onSelectRentalPlan,
}: ServiceActionSelectorProps) {
  const searchParams = useSearchParams();
  const intentParam = searchParams.get("intent") || "";
  const highlightedAction = INTENT_TO_ACTION[intentParam] || null;

  const hasAnyAction =
    allowedActions.buy ||
    allowedActions.apply ||
    allowedActions.rent ||
    allowedActions.deal;

  if (!hasAnyAction) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6">
        <p className="text-white font-medium">No actions available</p>
        <p className="text-sm text-slate-400 mt-1">
          This service is not currently available for purchase, application,
          rental, or deal.
        </p>
      </div>
    );
  }

  // Get cheapest rental price
  const cheapestRentalPrice =
    rentalPlans.length > 0
      ? Math.min(...rentalPlans.map((p) => p.price))
      : null;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          Choose How You Want to Use This Service
        </h2>
        <p className="text-slate-400 mt-2">
          Select the option that best fits your needs
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BUY Card */}
        {allowedActions.buy && (
          <ActionCard
            config={ACTION_CONFIG.buy}
            isHighlighted={highlightedAction === "buy"}
            isDisabled={!isActive}
            ctaText={isActive ? `Buy Now – $${price}` : "Currently Unavailable"}
            onClick={onBuy}
          />
        )}

        {/* APPLY Card */}
        {allowedActions.apply && (
          <ActionCard
            config={ACTION_CONFIG.apply}
            isHighlighted={highlightedAction === "apply"}
            isDisabled={!isActive}
            ctaText={isActive ? "Apply to Work" : "Currently Unavailable"}
            subText={payRate ? `Earn up to $${payRate}/hr` : undefined}
            onClick={onApply}
          />
        )}

        {/* RENT Card */}
        {allowedActions.rent && isRental && rentalPlans.length > 0 && (
          <RentActionCard
            config={ACTION_CONFIG.rent}
            isHighlighted={highlightedAction === "rent"}
            isDisabled={!isActive}
            rentalPlans={rentalPlans}
            selectedPlan={selectedRentalPlan}
            onSelectPlan={onSelectRentalPlan}
            onRent={onRent}
          />
        )}

        {/* DEAL Card */}
        {allowedActions.deal && (
          <ActionCard
            config={ACTION_CONFIG.deal}
            isHighlighted={highlightedAction === "deal"}
            isDisabled={!isActive}
            ctaText={isActive ? "Start Deal" : "Currently Unavailable"}
            onClick={onDeal}
          />
        )}
      </div>
    </div>
  );
}

// Individual Action Card Component
function ActionCard({
  config,
  isHighlighted,
  isDisabled,
  ctaText,
  subText,
  onClick,
}: {
  config: typeof ACTION_CONFIG.buy;
  isHighlighted: boolean;
  isDisabled: boolean;
  ctaText: string;
  subText?: string;
  onClick: () => void;
}) {
  return (
    <div
      className={`
        relative rounded-2xl border p-6 transition-all duration-300
        ${
          isHighlighted
            ? `${config.highlightBorder} ${config.highlightGlow} ${config.bgGlow}`
            : `border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-950/60 hover:border-white/20`
        }
      `}
    >
      {/* Highlighted Badge */}
      {isHighlighted && (
        <div className="absolute -top-3 left-4">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${config.gradient} text-white shadow-lg`}
          >
            Recommended
          </span>
        </div>
      )}

      {/* Icon & Title */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shadow-lg`}
        >
          {config.icon}
        </div>
        <h3 className="text-lg font-bold text-white">{config.title}</h3>
      </div>

      {/* Bullets */}
      <ul className="space-y-2 mb-6">
        {config.bullets.map((bullet, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 text-sm text-slate-300"
          >
            <span className="text-emerald-400 mt-0.5">✓</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      {/* Sub Text (e.g., pay rate) */}
      {subText && (
        <p className="text-sm text-emerald-300 font-medium mb-4">{subText}</p>
      )}

      {/* CTA Button */}
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        className={`
          w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-300
          bg-gradient-to-r ${config.gradient}
          ${
            isDisabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:shadow-[0_0_24px_rgba(59,130,246,0.4)] hover:scale-[1.02] active:scale-[0.98]"
          }
        `}
      >
        {ctaText}
      </button>
    </div>
  );
}

// Rent Action Card with Plan Selection
function RentActionCard({
  config,
  isHighlighted,
  isDisabled,
  rentalPlans,
  selectedPlan,
  onSelectPlan,
  onRent,
}: {
  config: typeof ACTION_CONFIG.rent;
  isHighlighted: boolean;
  isDisabled: boolean;
  rentalPlans: RentalPlan[];
  selectedPlan: number | null;
  onSelectPlan: (index: number) => void;
  onRent: (planIndex: number) => void;
}) {
  return (
    <div
      className={`
        relative rounded-2xl border p-6 transition-all duration-300
        ${
          isHighlighted
            ? `${config.highlightBorder} ${config.highlightGlow} ${config.bgGlow}`
            : `border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-950/60 hover:border-white/20`
        }
      `}
    >
      {/* Highlighted Badge */}
      {isHighlighted && (
        <div className="absolute -top-3 left-4">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${config.gradient} text-white shadow-lg`}
          >
            Recommended
          </span>
        </div>
      )}

      {/* Icon & Title */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shadow-lg`}
        >
          {config.icon}
        </div>
        <h3 className="text-lg font-bold text-white">{config.title}</h3>
      </div>

      {/* Bullets */}
      <ul className="space-y-2 mb-4">
        {config.bullets.map((bullet, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 text-sm text-slate-300"
          >
            <span className="text-emerald-400 mt-0.5">✓</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      {/* Plan Selection */}
      <div className="space-y-2 mb-4">
        <p className="text-xs text-slate-400 uppercase tracking-wide">
          Select a plan
        </p>
        {rentalPlans.map((plan, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPlan(idx)}
            className={`
              w-full text-left p-3 rounded-lg border transition-all
              ${
                selectedPlan === idx
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">
                  {plan.label}
                </span>
                {plan.isPopular && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
                    ⭐ Popular
                  </span>
                )}
              </div>
              <span className="text-emerald-300 font-bold">${plan.price}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {plan.duration} {plan.unit}
            </p>
          </button>
        ))}
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={() => selectedPlan !== null && onRent(selectedPlan)}
        disabled={isDisabled || selectedPlan === null}
        className={`
          w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-300
          bg-gradient-to-r ${config.gradient}
          ${
            isDisabled || selectedPlan === null
              ? "opacity-50 cursor-not-allowed"
              : "hover:shadow-[0_0_24px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-[0.98]"
          }
        `}
      >
        {isDisabled
          ? "Currently Unavailable"
          : selectedPlan !== null
            ? `Rent for $${rentalPlans[selectedPlan].price}`
            : "Select a Plan"}
      </button>
    </div>
  );
}
