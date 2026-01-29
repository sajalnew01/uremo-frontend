/**
 * PATCH_39: Status Label Normalization
 * Consistent status display labels across the application
 */

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  waiting_user: "Waiting For You",
  completed: "Completed",
  cancelled: "Cancelled",
  // Rental statuses
  active: "Active",
  expired: "Expired",
  renewed: "Renewed",
  // Worker statuses
  fresh: "Fresh",
  screening_available: "Screening Available",
  ready_to_work: "Ready To Work",
  assigned: "Assigned",
  inactive: "Inactive",
  // Application statuses
  approved: "Approved",
  rejected: "Rejected",
};

/**
 * Get a human-readable label for a status
 */
export function getStatusLabel(status: string | undefined | null): string {
  if (!status) return "Unknown";
  const normalized = status.toLowerCase().trim();
  return STATUS_LABELS[normalized] || status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Status badge color classes
 */
export const STATUS_COLORS: Record<string, string> = {
  pending: "border-slate-500/25 bg-slate-500/10 text-slate-200",
  in_progress: "border-purple-500/25 bg-purple-500/10 text-purple-200",
  waiting_user: "border-amber-500/25 bg-amber-500/10 text-amber-200",
  completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
  cancelled: "border-red-500/25 bg-red-500/10 text-red-200",
  active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
  expired: "border-red-500/25 bg-red-500/10 text-red-200",
  renewed: "border-blue-500/25 bg-blue-500/10 text-blue-200",
  fresh: "border-slate-500/25 bg-slate-500/10 text-slate-300",
  screening_available: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  ready_to_work: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  assigned: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  inactive: "border-red-500/25 bg-red-500/10 text-red-300",
  approved: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  rejected: "border-red-500/25 bg-red-500/10 text-red-300",
};

/**
 * Get badge color classes for a status
 */
export function getStatusColor(status: string | undefined | null): string {
  if (!status) return "border-white/10 bg-white/5 text-slate-200";
  const normalized = status.toLowerCase().trim();
  return STATUS_COLORS[normalized] || "border-white/10 bg-white/5 text-slate-200";
}

/**
 * Status icons
 */
export const STATUS_ICONS: Record<string, string> = {
  pending: "⏳",
  in_progress: "⚡",
  waiting_user: "🔍",
  completed: "🎉",
  cancelled: "❌",
  active: "✅",
  expired: "⏰",
  renewed: "🔄",
  fresh: "🌱",
  screening_available: "📋",
  ready_to_work: "✅",
  assigned: "💼",
  inactive: "⏸️",
};

/**
 * Get icon for a status
 */
export function getStatusIcon(status: string | undefined | null): string {
  if (!status) return "📦";
  const normalized = status.toLowerCase().trim();
  return STATUS_ICONS[normalized] || "📦";
}
