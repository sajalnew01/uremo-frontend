/**
 * Worker State Machine — Frontend mirror of backend workerStateMachine.js
 * FROZEN: Do NOT modify transitions. They must match backend exactly.
 */

import type { WorkerStatus } from "@/types";

/** Admin-allowed transitions (superset used by adminUpdateWorkerStatus) */
export const ADMIN_TRANSITIONS: Record<string, WorkerStatus[]> = {
  applied: ["screening_unlocked", "suspended"],
  screening_unlocked: ["training_viewed", "test_submitted", "ready_to_work", "suspended"],
  training_viewed: ["test_submitted", "ready_to_work", "suspended"],
  test_submitted: ["ready_to_work", "screening_unlocked", "failed", "suspended"],
  failed: ["screening_unlocked", "suspended"],
  ready_to_work: ["assigned", "suspended"],
  assigned: ["working", "ready_to_work", "suspended"],
  working: ["ready_to_work", "suspended"],
  suspended: ["ready_to_work", "screening_unlocked", "applied"],
};

/** Check if a transition is allowed */
export function canTransition(from: WorkerStatus, to: WorkerStatus): boolean {
  if (from === to) return true;
  const allowed = ADMIN_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/** Get allowed next statuses */
export function getAllowedTransitions(from: WorkerStatus): WorkerStatus[] {
  return ADMIN_TRANSITIONS[from] ?? [];
}

/** Pipeline columns (ordered) */
export const PIPELINE_COLUMNS: WorkerStatus[] = [
  "applied",
  "screening_unlocked",
  "training_viewed",
  "test_submitted",
  "ready_to_work",
  "assigned",
  "working",
  "suspended",
  "failed",
];

/** Status display labels */
export const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  screening_unlocked: "Screening Unlocked",
  training_viewed: "Training Viewed",
  test_submitted: "Test Submitted",
  ready_to_work: "Ready to Work",
  assigned: "Assigned",
  working: "Working",
  suspended: "Suspended",
  failed: "Failed",
  fresh: "Fresh",
  screening_available: "Screening Available",
  inactive: "Inactive",
};

/** Status color classes for chips (dark theme) */
export const STATUS_COLORS: Record<string, { bg: string; text: string; glow?: string }> = {
  applied: { bg: "bg-blue-900/40", text: "text-blue-300", glow: "shadow-blue-500/20" },
  screening_unlocked: { bg: "bg-indigo-900/40", text: "text-indigo-300", glow: "shadow-indigo-500/20" },
  training_viewed: { bg: "bg-violet-900/40", text: "text-violet-300" },
  test_submitted: { bg: "bg-amber-900/40", text: "text-amber-300", glow: "shadow-amber-500/20" },
  ready_to_work: { bg: "bg-emerald-900/40", text: "text-emerald-300", glow: "shadow-emerald-500/30" },
  assigned: { bg: "bg-cyan-900/40", text: "text-cyan-300", glow: "shadow-cyan-500/20" },
  working: { bg: "bg-green-900/40", text: "text-green-300", glow: "shadow-green-500/30" },
  suspended: { bg: "bg-red-900/40", text: "text-red-300" },
  failed: { bg: "bg-rose-900/40", text: "text-rose-400" },
  fresh: { bg: "bg-gray-800/40", text: "text-gray-400" },
  screening_available: { bg: "bg-gray-800/40", text: "text-gray-400" },
  inactive: { bg: "bg-gray-800/40", text: "text-gray-400" },
};

/** Tier colors */
export const TIER_COLORS: Record<string, string> = {
  bronze: "text-orange-400",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  elite: "text-purple-400",
};

/** Project status colors */
export const PROJECT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-gray-800/50", text: "text-gray-400" },
  open: { bg: "bg-blue-900/40", text: "text-blue-300" },
  assigned: { bg: "bg-cyan-900/40", text: "text-cyan-300" },
  in_progress: { bg: "bg-amber-900/40", text: "text-amber-300" },
  completed: { bg: "bg-emerald-900/40", text: "text-emerald-300" },
  cancelled: { bg: "bg-red-900/40", text: "text-red-400" },
};
