"use client";

import React from "react";

/**
 * PATCH-65: State-Aware Action Panel
 *
 * Shows ONLY valid actions based on current worker status.
 * Invalid actions are hidden or shown as disabled with explanation.
 *
 * Matches backend state machine exactly:
 * - fresh/applied → screening_unlocked
 * - screening_unlocked → test_submitted
 * - test_submitted → ready_to_work | failed
 * - ready_to_work → assigned
 * - assigned → working | ready_to_work
 * - working → suspended | ready_to_work
 * - suspended → ready_to_work
 */

// State machine transitions (mirror of backend)
const VALID_TRANSITIONS: Record<string, string[]> = {
  fresh: ["screening_unlocked"],
  applied: ["screening_unlocked"],
  screening_unlocked: ["test_submitted"],
  training_viewed: ["test_submitted"],
  test_submitted: ["ready_to_work", "failed"],
  failed: ["screening_unlocked"], // Allow retry
  ready_to_work: ["assigned"],
  assigned: ["working", "ready_to_work"],
  working: ["suspended", "ready_to_work", "completed"],
  suspended: ["ready_to_work"],
};

// Action definitions
interface ActionDef {
  id: string;
  label: string;
  icon: string;
  targetStatus?: string;
  color: "emerald" | "amber" | "red" | "blue" | "slate" | "cyan";
  description: string;
  isDangerous?: boolean;
}

// All possible admin actions
const ALL_ACTIONS: ActionDef[] = [
  {
    id: "approve",
    label: "Approve Application",
    icon: "✓",
    targetStatus: "screening_unlocked",
    color: "emerald",
    description: "Approve and unlock screening access",
  },
  {
    id: "reject",
    label: "Reject Application",
    icon: "✕",
    color: "red",
    description: "Permanently reject this application",
    isDangerous: true,
  },
  {
    id: "unlock_screening",
    label: "Unlock Screening",
    icon: "Unlock",
    targetStatus: "screening_unlocked",
    color: "amber",
    description: "Grant access to training & screening test",
  },
  {
    id: "pass_test",
    label: "Pass Screening",
    icon: "✓",
    targetStatus: "ready_to_work",
    color: "emerald",
    description: "Mark screening as passed, enable project assignment",
  },
  {
    id: "fail_test",
    label: "Fail Screening",
    icon: "✕",
    targetStatus: "failed",
    color: "red",
    description: "Mark screening as failed",
    isDangerous: true,
  },
  {
    id: "allow_retry",
    label: "Allow Retry",
    icon: "Retry",
    targetStatus: "screening_unlocked",
    color: "amber",
    description: "Reset screening and allow another attempt",
  },
  {
    id: "assign_project",
    label: "Assign Project",
    icon: "Assign",
    targetStatus: "assigned",
    color: "blue",
    description: "Assign a project to this worker",
  },
  {
    id: "start_work",
    label: "Start Working",
    icon: "Work",
    targetStatus: "working",
    color: "cyan",
    description: "Mark worker as actively working",
  },
  {
    id: "complete_project",
    label: "Complete Project",
    icon: "Done",
    targetStatus: "completed",
    color: "emerald",
    description: "Mark project as completed",
  },
  {
    id: "unassign",
    label: "Unassign Project",
    icon: "Back",
    targetStatus: "ready_to_work",
    color: "amber",
    description: "Remove current project assignment",
  },
  {
    id: "suspend",
    label: "Suspend Worker",
    icon: "Hold",
    targetStatus: "suspended",
    color: "red",
    description: "Temporarily block worker access",
    isDangerous: true,
  },
  {
    id: "reactivate",
    label: "Reactivate Worker",
    icon: "✓",
    targetStatus: "ready_to_work",
    color: "emerald",
    description: "Restore worker access",
  },
];

// Map status to available actions
const STATUS_ACTIONS: Record<string, string[]> = {
  applied: ["approve", "reject"],
  fresh: ["approve", "reject"],
  screening_unlocked: [], // Waiting for worker
  training_viewed: [], // Waiting for worker
  test_submitted: ["pass_test", "fail_test"],
  failed: ["allow_retry", "reject"],
  ready_to_work: ["assign_project", "suspend"],
  assigned: ["start_work", "unassign", "suspend"],
  working: ["complete_project", "unassign", "suspend"],
  suspended: ["reactivate"],
  completed: ["assign_project"],
};

// Reasons why actions might be unavailable
const UNAVAILABLE_REASONS: Record<string, Record<string, string>> = {
  applied: {
    assign_project: "Worker must pass screening first",
    pass_test: "Worker hasn't submitted a test yet",
    fail_test: "Worker hasn't submitted a test yet",
    suspend: "Approve or reject the application instead",
  },
  screening_unlocked: {
    approve: "Application already approved",
    assign_project: "Worker must pass screening first",
    pass_test: "Worker hasn't submitted the test yet",
    suspend: "Wait for screening completion first",
  },
  test_submitted: {
    assign_project: "Review and pass/fail the test first",
    approve: "Application already approved",
  },
  ready_to_work: {
    pass_test: "Screening already passed",
    approve: "Application already approved",
    reactivate: "Worker is not suspended",
  },
  assigned: {
    assign_project: "Already assigned to a project",
    pass_test: "Screening already passed",
  },
  working: {
    assign_project: "Already working on a project",
    pass_test: "Screening already passed",
  },
  suspended: {
    assign_project: "Worker is suspended",
    pass_test: "Worker is suspended",
    suspend: "Already suspended",
  },
};

interface StateAwareActionPanelProps {
  currentStatus: string;
  applicationStatus?: string;
  hasValidIdentity?: boolean;
  onAction: (actionId: string) => void;
  isLoading?: string | null;
  showUnavailable?: boolean;
}

export function StateAwareActionPanel({
  currentStatus,
  applicationStatus = "pending",
  hasValidIdentity = true,
  onAction,
  isLoading,
  showUnavailable = false,
}: StateAwareActionPanelProps) {
  // Get available action IDs for current status
  const availableIds = STATUS_ACTIONS[currentStatus] || [];

  // Special case: applied + pending needs approve option
  const effectiveStatus =
    currentStatus === "applied" && applicationStatus === "pending"
      ? "applied"
      : currentStatus === "applied" && applicationStatus === "approved"
        ? "screening_unlocked"
        : currentStatus;

  const actionIds = STATUS_ACTIONS[effectiveStatus] || availableIds;

  // Get action definitions
  const availableActions = ALL_ACTIONS.filter((a) => actionIds.includes(a.id));
  const unavailableActions = showUnavailable
    ? ALL_ACTIONS.filter((a) => !actionIds.includes(a.id) && a.id !== "reject")
    : [];

  const colorClasses: Record<string, string> = {
    emerald:
      "bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-emerald-600/50",
    amber:
      "bg-amber-600 hover:bg-amber-500 text-white disabled:bg-amber-600/50",
    red: "bg-red-600/20 hover:bg-red-600/30 text-red-400 disabled:bg-red-600/10",
    blue: "bg-blue-600 hover:bg-blue-500 text-white disabled:bg-blue-600/50",
    cyan: "bg-cyan-600 hover:bg-cyan-500 text-white disabled:bg-cyan-600/50",
    slate:
      "bg-slate-600 hover:bg-slate-500 text-white disabled:bg-slate-600/50",
  };

  if (!hasValidIdentity) {
    return (
      <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-sm text-red-400">
          ! Worker identity is missing. Actions are disabled.
        </p>
      </div>
    );
  }

  // Show waiting state for passive statuses
  if (availableActions.length === 0) {
    const waitingMessages: Record<string, string> = {
      screening_unlocked:
        "Waiting for worker to view training and submit test...",
      training_viewed: "Waiting for worker to submit screening test...",
    };

    const message =
      waitingMessages[currentStatus] || "No actions available for this status.";

    return (
      <div className="px-4 py-3 bg-slate-700/50 text-slate-300 rounded-lg flex items-center gap-2">
        <span className="animate-pulse">...</span>
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Available actions */}
      <div className="flex flex-wrap gap-3">
        {availableActions.map((action) => (
          <div key={action.id} className="group relative">
            <button
              onClick={() => onAction(action.id)}
              disabled={isLoading === action.id}
              className={`px-5 py-2.5 rounded-lg font-medium transition flex items-center gap-2 ${colorClasses[action.color]} disabled:opacity-50`}
            >
              {isLoading === action.id ? (
                <span className="animate-pulse">...</span>
              ) : (
                <span>{action.icon}</span>
              )}
              <span>{action.label}</span>
            </button>

            {/* Tooltip with description */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-[200px]">
              <p className="text-xs text-slate-300">{action.description}</p>
              {action.targetStatus && (
                <p className="text-xs text-slate-500 mt-1">
                  → Changes status to:{" "}
                  <span className="text-cyan-400">{action.targetStatus}</span>
                </p>
              )}
              {action.isDangerous && (
                <p className="text-xs text-red-400 mt-1">
                  ! This action is irreversible
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Unavailable actions (if showUnavailable) */}
      {showUnavailable && unavailableActions.length > 0 && (
        <div className="pt-3 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 mb-2">Unavailable actions:</p>
          <div className="flex flex-wrap gap-2">
            {unavailableActions.slice(0, 4).map((action) => {
              const reason =
                UNAVAILABLE_REASONS[currentStatus]?.[action.id] ||
                `Not available in "${currentStatus}" state`;

              return (
                <div key={action.id} className="group relative">
                  <button
                    disabled
                    className="px-3 py-1.5 rounded-lg text-sm bg-slate-700/30 text-slate-500 cursor-not-allowed flex items-center gap-1.5"
                  >
                    <span className="opacity-50">{action.icon}</span>
                    <span>{action.label}</span>
                  </button>

                  {/* Tooltip explaining why unavailable */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-[180px]">
                    <p className="text-xs text-slate-400">{reason}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper hook to get action description for confirmation modal
 */
export function getActionTransitionInfo(
  actionId: string,
  currentStatus: string,
): { fromStatus: string; toStatus: string; description: string } | null {
  const action = ALL_ACTIONS.find((a) => a.id === actionId);
  if (!action) return null;

  return {
    fromStatus: currentStatus,
    toStatus: action.targetStatus || "unknown",
    description: action.description,
  };
}

export default StateAwareActionPanel;
