"use client";

import type { Intent, AllowedActions, RentalPlan } from "@/types";

/* ─── INTENT TABS ─── */
const INTENTS: { key: Intent; label: string; color: string }[] = [
  { key: "all", label: "All", color: "var(--color-text-primary)" },
  { key: "buy", label: "Buy", color: "var(--color-intent-buy)" },
  { key: "earn", label: "Earn", color: "var(--color-intent-earn)" },
  { key: "rent", label: "Rent", color: "var(--color-intent-rent)" },
  { key: "deal", label: "Deal", color: "var(--color-intent-deal)" },
];

interface IntentTabsProps {
  active: Intent;
  onChange: (i: Intent) => void;
  counts?: Record<string, number>;
}

export function IntentTabs({ active, onChange, counts }: IntentTabsProps) {
  return (
    <div style={{ display: "flex", gap: "var(--space-1)", background: "var(--color-bg-tertiary)", borderRadius: "var(--radius-md)", padding: 2 }}>
      {INTENTS.map((i) => (
        <button
          key={i.key}
          onClick={() => onChange(i.key)}
          style={{
            padding: "var(--space-2) var(--space-4)",
            borderRadius: "var(--radius-md)",
            border: "none",
            cursor: "pointer",
            fontSize: "var(--text-sm)",
            fontWeight: active === i.key ? 600 : 400,
            color: active === i.key ? i.color : "var(--color-text-secondary)",
            background: active === i.key ? "var(--color-bg-elevated)" : "transparent",
            transition: "all var(--transition-fast)",
            whiteSpace: "nowrap",
          }}
        >
          {i.label}
          {counts?.[i.key] !== undefined && (
            <span style={{ marginLeft: 4, fontSize: "var(--text-xs)", opacity: 0.7 }}>
              ({counts[i.key]})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── STICKY ACTION BAR ─── */
interface StickyActionBarProps {
  serviceTitle: string;
  price: number;
  payRate?: number;
  allowedActions: AllowedActions;
  rentalPlans?: RentalPlan[];
  selectedRentalPlan?: number | null;
  onBuy?: () => void;
  onApply?: () => void;
  onRent?: (planIndex: number) => void;
  onDeal?: () => void;
  onHelp?: () => void;
  visible: boolean;
}

export function StickyActionBar({
  serviceTitle,
  price,
  payRate,
  allowedActions,
  rentalPlans,
  selectedRentalPlan,
  onBuy,
  onApply,
  onRent,
  onDeal,
  onHelp,
  visible,
}: StickyActionBarProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: "var(--z-sticky)" as unknown as number,
        background: "var(--color-bg-elevated)",
        borderTop: "1px solid var(--color-border)",
        padding: "var(--space-3) var(--space-6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "var(--shadow-lg)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{serviceTitle}</div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
          {price > 0 ? `$${price}` : payRate ? `$${payRate}/task` : "Free"}
        </div>
      </div>
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        {allowedActions.buy && (
          <button className="u-btn u-btn-primary u-btn-sm" onClick={onBuy}>
            Buy
          </button>
        )}
        {allowedActions.apply && (
          <button
            className="u-btn u-btn-sm"
            style={{ background: "var(--color-intent-earn)", color: "white", border: "none" }}
            onClick={onApply}
          >
            Apply
          </button>
        )}
        {allowedActions.rent && rentalPlans && rentalPlans.length > 0 && (
          <button
            className="u-btn u-btn-sm"
            style={{ background: "var(--color-intent-rent)", color: "white", border: "none" }}
            onClick={() => onRent?.(selectedRentalPlan ?? 0)}
          >
            Rent
          </button>
        )}
        {allowedActions.deal && (
          <button
            className="u-btn u-btn-sm"
            style={{ background: "var(--color-intent-deal)", color: "black", border: "none" }}
            onClick={onDeal}
          >
            Deal
          </button>
        )}
        {onHelp && (
          <button className="u-btn u-btn-ghost u-btn-sm" onClick={onHelp}>
            ?
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── RENTAL PLAN SELECTOR ─── */
interface RentalPlanSelectorProps {
  plans: RentalPlan[];
  selected: number | null;
  onSelect: (index: number) => void;
}

export function RentalPlanSelector({ plans, selected, onSelect }: RentalPlanSelectorProps) {
  if (!plans?.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>Rental Plans</div>
      {plans.map((plan, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-3) var(--space-4)",
            borderRadius: "var(--radius-md)",
            border: `2px solid ${selected === i ? "var(--color-intent-rent)" : "var(--color-border)"}`,
            background: selected === i ? "rgba(167, 139, 250, 0.1)" : "var(--color-bg-tertiary)",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
          }}
        >
          <div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>{plan.label || plan.type}</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              {plan.duration} days
            </div>
          </div>
          <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-intent-rent)" }}>
            ${plan.price}
          </div>
        </button>
      ))}
    </div>
  );
}
