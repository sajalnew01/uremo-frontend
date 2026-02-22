/**
 * Worker Status State Machine — EXACT COPY of backend workspace.controller.js ALLOWED_TRANSITIONS
 * DO NOT MODIFY without backend change. This is a frozen contract.
 */

import type { WorkerStatus } from "@/types";

export const WORKER_STATUS_TRANSITIONS: Record<string, WorkerStatus[]> = {
  applied:            ["screening_unlocked", "suspended"],
  screening_unlocked: ["training_viewed", "test_submitted", "ready_to_work", "suspended"],
  training_viewed:    ["test_submitted", "ready_to_work", "suspended"],
  test_submitted:     ["ready_to_work", "screening_unlocked", "failed", "suspended"],
  failed:             ["screening_unlocked", "suspended"],
  ready_to_work:      ["assigned", "suspended"],
  assigned:           ["working", "ready_to_work", "suspended"],
  working:            ["ready_to_work", "suspended"],
  suspended:          ["ready_to_work", "screening_unlocked", "applied"],
};

/** Pipeline column order for kanban view */
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

/** Color map for worker status chips */
export const STATUS_COLORS: Record<string, { bg: string; text: string; glow?: string }> = {
  applied:            { bg: "bg-blue-500/15",   text: "text-blue-400" },
  screening_unlocked: { bg: "bg-indigo-500/15", text: "text-indigo-400" },
  training_viewed:    { bg: "bg-violet-500/15", text: "text-violet-400" },
  test_submitted:     { bg: "bg-amber-500/15",  text: "text-amber-400" },
  ready_to_work:      { bg: "bg-emerald-500/15",text: "text-emerald-400" },
  assigned:           { bg: "bg-cyan-500/15",    text: "text-cyan-400", glow: "shadow-[0_0_8px_rgba(34,211,238,0.3)]" },
  working:            { bg: "bg-green-500/15",   text: "text-green-400", glow: "shadow-[0_0_8px_rgba(74,222,128,0.3)]" },
  suspended:          { bg: "bg-red-500/15",     text: "text-red-400" },
  failed:             { bg: "bg-rose-500/15",    text: "text-rose-400" },
  fresh:              { bg: "bg-gray-500/15",    text: "text-gray-400" },
  screening_available:{ bg: "bg-purple-500/15",  text: "text-purple-400" },
  inactive:           { bg: "bg-gray-500/15",    text: "text-gray-500" },
};

/** Human-readable labels */
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

/** Project status colors */
export const PROJECT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft:       { bg: "bg-gray-500/15",    text: "text-gray-400" },
  open:        { bg: "bg-blue-500/15",    text: "text-blue-400" },
  assigned:    { bg: "bg-cyan-500/15",    text: "text-cyan-400" },
  in_progress: { bg: "bg-amber-500/15",   text: "text-amber-400" },
  completed:   { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  cancelled:   { bg: "bg-red-500/15",     text: "text-red-400" },
};

/** Check if a transition is allowed by the state machine */
export function canTransition(from: string, to: string): boolean {
  const allowed = WORKER_STATUS_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to as WorkerStatus);
}

/** Get allowed transitions for a given status */
export function getAllowedTransitions(from: string): WorkerStatus[] {
  return WORKER_STATUS_TRANSITIONS[from] || [];
}
