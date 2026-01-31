/**
 * PATCH_52: Centralized Status Configuration
 * Single source of truth for all status labels and colors
 */

export interface StatusConfig {
  label: string;
  color: "yellow" | "blue" | "orange" | "green" | "red" | "gray" | "purple";
}

export const STATUS_MAP: Record<string, StatusConfig> = {
  // Order statuses
  pending: { label: "Pending", color: "yellow" },
  payment_pending: { label: "Payment Pending", color: "yellow" },
  payment_submitted: { label: "Payment Submitted", color: "orange" },
  processing: { label: "Processing", color: "blue" },
  in_progress: { label: "In Progress", color: "blue" },
  waiting_user: { label: "Waiting For You", color: "orange" },
  completed: { label: "Completed", color: "green" },
  cancelled: { label: "Cancelled", color: "red" },
  rejected: { label: "Rejected", color: "red" },

  // Rental statuses
  active: { label: "Active", color: "green" },
  expired: { label: "Expired", color: "gray" },
  renewed: { label: "Renewed", color: "blue" },

  // Worker/Application statuses
  fresh: { label: "Fresh Applicant", color: "gray" },
  screening_available: { label: "Screening Available", color: "yellow" },
  screening_in_progress: { label: "Screening In Progress", color: "blue" },
  screening_passed: { label: "Screening Passed", color: "green" },
  screening_failed: { label: "Screening Failed", color: "red" },
  ready_to_work: { label: "Ready To Work", color: "green" },
  assigned: { label: "Assigned", color: "blue" },
  project_in_progress: { label: "Working", color: "purple" },
  under_review: { label: "Under Review", color: "orange" },
  // rejected already defined above in order statuses
  approved: { label: "Approved", color: "green" },
  inactive: { label: "Inactive", color: "gray" },

  // Ticket statuses
  open: { label: "Open", color: "blue" },
  closed: { label: "Closed", color: "gray" },

  // Proof statuses (same as above but explicit)
  // pending, approved, rejected already defined
};

/**
 * Color to Tailwind class mapping
 */
const COLOR_CLASSES: Record<string, string> = {
  yellow: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  blue: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  orange: "border-orange-500/25 bg-orange-500/10 text-orange-300",
  green: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  red: "border-red-500/25 bg-red-500/10 text-red-300",
  gray: "border-slate-500/25 bg-slate-500/10 text-slate-300",
  purple: "border-purple-500/25 bg-purple-500/10 text-purple-300",
};

/**
 * Get human-readable label for a status
 */
export function getStatusLabel(status: string | undefined | null): string {
  if (!status) return "Unknown";
  const normalized = status.toLowerCase().trim();
  const config = STATUS_MAP[normalized];
  if (config) return config.label;
  // Fallback: convert snake_case to Title Case
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get Tailwind classes for status badge
 */
export function getStatusColor(status: string | undefined | null): string {
  if (!status) return COLOR_CLASSES.gray;
  const normalized = status.toLowerCase().trim();
  const config = STATUS_MAP[normalized];
  if (config) return COLOR_CLASSES[config.color];
  return COLOR_CLASSES.gray;
}

/**
 * Get just the color name for a status
 */
export function getStatusColorName(status: string | undefined | null): string {
  if (!status) return "gray";
  const normalized = status.toLowerCase().trim();
  const config = STATUS_MAP[normalized];
  return config?.color || "gray";
}

/**
 * Status Badge Component helper - returns props for badge styling
 */
export function getStatusBadgeProps(status: string | undefined | null) {
  return {
    label: getStatusLabel(status),
    className: `inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(status)}`,
  };
}
