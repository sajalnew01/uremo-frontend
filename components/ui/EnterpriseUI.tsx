/**
 * PATCH_102: Enterprise UI Components
 * Shared, typed, design-system-compliant components.
 * PRESENTATIONAL ONLY — no business logic.
 */

"use client";

import React from "react";
import {
  btn,
  badge,
  BADGE,
  BUTTON,
  CARD,
  INPUT,
  TYPOGRAPHY,
  COMING_SOON,
  EMPTY,
  PAGE,
  getStatusStyle,
} from "@/lib/designSystem";

// ============================================
// STATUS BADGE
// ============================================
interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  payment_pending: "Payment Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
  applied: "Applied",
  approved: "Approved",
  screening_unlocked: "Screening Available",
  screening_in_progress: "Screening In Progress",
  test_submitted: "Submitted",
  screening_passed: "Passed",
  screening_failed: "Failed",
  ready_to_work: "Ready",
  assigned: "Assigned",
  working: "Working",
  suspended: "Suspended",
  active: "Active",
  expired: "Expired",
  open: "Open",
  closed: "Closed",
  proof_submitted: "Proof Submitted",
  under_review: "Under Review",
  failed: "Failed",
  processing: "Processing",
  training_viewed: "Training Viewed",
  fresh: "New",
  inactive: "Inactive",
};

export function StatusBadge({
  status,
  label,
  size = "sm",
  className = "",
}: StatusBadgeProps) {
  const style = getStatusStyle(status);
  const displayLabel =
    label ||
    STATUS_LABELS[status] ||
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const sizeClass =
    size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${style.bg} ${style.text} ${style.border} ${sizeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {displayLabel}
    </span>
  );
}

// ============================================
// SERVICE TYPE BADGE
// ============================================
type ServiceType = "microjob" | "aiDataset" | "rental" | "deal" | "buy";

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  microjob: "Microjob",
  aiDataset: "AI Dataset",
  rental: "Rental",
  deal: "Deal",
  buy: "Service",
};

interface ServiceTypeBadgeProps {
  type: ServiceType;
  className?: string;
}

export function ServiceTypeBadge({
  type,
  className = "",
}: ServiceTypeBadgeProps) {
  return (
    <span className={`${badge(type)} ${className}`}>
      {SERVICE_TYPE_LABELS[type] || type}
    </span>
  );
}

// ============================================
// BUTTON
// ============================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BUTTON.variants;
  size?: keyof typeof BUTTON.sizes;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${btn(variant, size)} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

// ============================================
// CARD
// ============================================
interface CardProps {
  children: React.ReactNode;
  variant?: "base" | "interactive" | "elevated";
  padding?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  variant = "base",
  padding = "md",
  className = "",
  onClick,
}: CardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className={`${CARD[variant]} ${CARD.padding[padding]} ${className}`}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      {children}
    </Tag>
  );
}

// ============================================
// PAGE HEADER
// ============================================
interface PageTitleProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageTitle({
  title,
  subtitle,
  actions,
  className = "",
}: PageTitleProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${PAGE.header} ${className}`}
    >
      <div>
        <h1 className={TYPOGRAPHY.h1}>{title}</h1>
        {subtitle && (
          <p className={`${TYPOGRAPHY.body} text-slate-400 mt-1`}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}

// ============================================
// COMING SOON BANNER
// ============================================
interface ComingSoonProps {
  title?: string;
  subtitle?: string;
  icon?: string;
}

export function ComingSoonBanner({
  title = "Coming Soon",
  subtitle = "This feature is currently under development. Check back soon!",
  icon = "○",
}: ComingSoonProps) {
  return (
    <div className={COMING_SOON.container}>
      <div className={COMING_SOON.icon}>{icon}</div>
      <h2 className={COMING_SOON.title}>{title}</h2>
      <p className={COMING_SOON.subtitle}>{subtitle}</p>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================
interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyStateBlock({
  icon = "○",
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  return (
    <div className={EMPTY.container}>
      <div className={EMPTY.icon}>{icon}</div>
      <h3 className={EMPTY.title}>{title}</h3>
      {subtitle && <p className={EMPTY.subtitle}>{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================
// SECTION SEPARATOR
// ============================================
export function SectionDivider({ label }: { label?: string }) {
  if (!label) return <hr className="border-white/5 my-6" />;
  return (
    <div className="flex items-center gap-3 my-6">
      <hr className="flex-1 border-white/5" />
      <span className={TYPOGRAPHY.overline}>{label}</span>
      <hr className="flex-1 border-white/5" />
    </div>
  );
}

// ============================================
// STAT CARD
// ============================================
interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, change, icon }: StatCardProps) {
  return (
    <div className={`${CARD.base} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className={TYPOGRAPHY.caption}>{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {change && (
          <span
            className={`text-xs font-medium mb-0.5 ${change.startsWith("+") ? "text-emerald-400" : change.startsWith("-") ? "text-red-400" : "text-slate-400"}`}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// TAB BAR
// ============================================
interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export function TabBar({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: TabBarProps) {
  return (
    <div
      className={`flex items-center gap-1 border-b border-white/5 overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === tab.id
              ? "border-blue-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/10"
          }`}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-white/5 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================
// SCREENING STATUS INDICATOR
// ============================================
type ScreeningPhase =
  | "required"
  | "in_progress"
  | "submitted"
  | "approved"
  | "failed";

const SCREENING_PHASE_CONFIG: Record<
  ScreeningPhase,
  { label: string; color: string; icon: string }
> = {
  required: {
    label: "Required",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    icon: "!",
  },
  in_progress: {
    label: "In Progress",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    icon: "...",
  },
  submitted: {
    label: "Submitted",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    icon: "Sent",
  },
  approved: {
    label: "Approved",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    icon: "OK",
  },
  failed: {
    label: "Failed",
    color: "text-red-400 bg-red-500/10 border-red-500/20",
    icon: "X",
  },
};

interface ScreeningStatusProps {
  phase: ScreeningPhase;
  className?: string;
}

export function ScreeningStatus({
  phase,
  className = "",
}: ScreeningStatusProps) {
  const config =
    SCREENING_PHASE_CONFIG[phase] || SCREENING_PHASE_CONFIG.required;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${config.color} ${className}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

// ============================================
// WORKFLOW TIMELINE (Microjob vs RLHF)
// ============================================
interface TimelineStep {
  label: string;
  status: "completed" | "active" | "upcoming";
  detail?: string;
}

interface WorkflowTimelineProps {
  steps: TimelineStep[];
  variant?: "microjob" | "rlhf";
}

export function WorkflowTimeline({
  steps,
  variant = "microjob",
}: WorkflowTimelineProps) {
  const accentColor = variant === "rlhf" ? "violet" : "emerald";

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center min-w-[80px]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                step.status === "completed"
                  ? `bg-${accentColor}-500/20 border-${accentColor}-500 text-${accentColor}-400`
                  : step.status === "active"
                    ? `bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse`
                    : "bg-white/5 border-white/10 text-slate-500"
              }`}
            >
              {step.status === "completed" ? "✓" : i + 1}
            </div>
            <span
              className={`text-[11px] mt-1.5 text-center leading-tight ${
                step.status === "active"
                  ? "text-white font-medium"
                  : "text-slate-500"
              }`}
            >
              {step.label}
            </span>
            {step.detail && (
              <span className="text-[10px] text-slate-600 mt-0.5">
                {step.detail}
              </span>
            )}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 min-w-[20px] mt-[-18px] ${
                step.status === "completed"
                  ? `bg-${accentColor}-500/40`
                  : "bg-white/5"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Re-export design system tokens for convenience
export { TYPOGRAPHY, CARD, INPUT, PAGE, SPACING } from "@/lib/designSystem";
