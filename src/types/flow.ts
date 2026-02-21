/* ─── FLOW ENGINE TYPES ─── */
// Mirrors backend core/flowEngine.js transitions

export type FlowEntity = "order" | "rental" | "ticket" | "worker" | "project";

export interface FlowTransition {
  from: string;
  to: string;
  label: string;
  confirmMessage: string;
}

/** Backend-aligned valid transitions per entity */
export const FLOW_TRANSITIONS: Record<FlowEntity, Record<string, string[]>> = {
  order: {
    pending: ["in_progress", "cancelled"],
    in_progress: ["waiting_user", "completed", "cancelled"],
    waiting_user: ["in_progress", "completed", "cancelled"],
    completed: [],
    cancelled: [],
  },
  rental: {
    pending: ["active", "cancelled"],
    active: ["expired", "cancelled"],
    expired: ["renewed"],
    cancelled: [],
    renewed: [],
  },
  ticket: {
    open: ["in_progress", "waiting_user", "resolved", "closed"],
    in_progress: ["waiting_user", "resolved", "closed"],
    waiting_user: ["in_progress", "resolved", "closed"],
    resolved: ["closed"],
    closed: [],
  },
  worker: {
    applied: ["screening_unlocked", "failed"],
    screening_unlocked: ["training_viewed", "test_submitted", "failed"],
    training_viewed: ["screening_available", "test_submitted"],
    screening_available: ["test_submitted"],
    test_submitted: ["ready_to_work", "failed"],
    failed: ["screening_unlocked"],
    ready_to_work: ["assigned", "suspended", "inactive"],
    assigned: ["working", "suspended"],
    working: ["assigned", "ready_to_work", "suspended"],
    suspended: ["ready_to_work"],
    fresh: ["applied", "screening_unlocked"],
    inactive: ["ready_to_work"],
  },
  project: {
    draft: ["active"],
    active: ["assigned"],
    assigned: ["in_progress"],
    in_progress: ["submitted"],
    submitted: ["completed", "in_progress"],
    completed: [],
  },
};

/** Wallet transaction valid transitions */
export const WALLET_TRANSITIONS: Record<string, string[]> = {
  initiated: ["pending", "paid_unverified", "failed"],
  pending: ["paid_unverified", "success", "failed"],
  paid_unverified: ["success", "failed"],
  success: [],
  failed: [],
};

/** Check if a transition is valid */
export function canTransition(entity: FlowEntity, currentState: string, targetState: string): boolean {
  const transitions = FLOW_TRANSITIONS[entity];
  if (!transitions) return false;
  const allowed = transitions[currentState];
  if (!allowed) return false;
  return allowed.includes(targetState);
}

/** Get allowed next states */
export function getAllowedTransitions(entity: FlowEntity, currentState: string): string[] {
  return FLOW_TRANSITIONS[entity]?.[currentState] ?? [];
}

/** Get human-readable label for transition */
export function getTransitionLabel(from: string, to: string): string {
  const labels: Record<string, string> = {
    pending_active: "Activate",
    pending_cancelled: "Cancel",
    pending_in_progress: "Start Processing",
    in_progress_completed: "Mark Completed",
    in_progress_waiting_user: "Await User Response",
    in_progress_cancelled: "Cancel",
    waiting_user_in_progress: "Resume Processing",
    waiting_user_completed: "Mark Completed",
    active_expired: "Expire",
    active_cancelled: "Cancel",
    expired_renewed: "Renew",
    applied_screening_unlocked: "Unlock Screening",
    screening_unlocked_training_viewed: "Mark Training Viewed",
    test_submitted_ready_to_work: "Approve Worker",
    test_submitted_failed: "Reject Worker",
    ready_to_work_assigned: "Assign Task",
    assigned_working: "Start Working",
    working_ready_to_work: "Unassign",
    draft_active: "Activate",
    active_assigned: "Assign",
    assigned_in_progress: "Start",
    in_progress_submitted: "Submit",
    submitted_completed: "Approve",
    open_in_progress: "Start Working",
    open_resolved: "Resolve",
    open_closed: "Close",
    resolved_closed: "Close",
  };
  return labels[`${from}_${to}`] ?? `→ ${to.replace(/_/g, " ")}`;
}
