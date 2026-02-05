"use client";

import React from "react";

/**
 * PATCH-65.1: Project Completion Confirmation
 *
 * Shows explicit confirmation of project completion status:
 * - Proof status (submitted/approved/rejected)
 * - Payout status (pending/credited)
 * - Earnings credited confirmation
 *
 * NO SILENT COMPLETION - admins and workers must see explicit confirmation.
 */

interface CompletionData {
  proofStatus: "not_submitted" | "pending" | "approved" | "rejected";
  payoutStatus: "not_applicable" | "pending" | "credited";
  earningsCredited: number;
  creditedAt?: string;
  proofRejectionReason?: string;
  projectCompletedAt?: string;
}

interface ProjectCompletionConfirmationProps {
  isCompleted: boolean;
  completion: CompletionData;
  projectTitle?: string;
  showFullDetails?: boolean;
}

export function ProjectCompletionConfirmation({
  isCompleted,
  completion,
  projectTitle,
  showFullDetails = true,
}: ProjectCompletionConfirmationProps) {
  // Determine overall completion state
  const isFullyClosed =
    completion.proofStatus === "approved" &&
    completion.payoutStatus === "credited";

  const isPending =
    completion.proofStatus === "pending" ||
    completion.payoutStatus === "pending";

  const hasProblem =
    completion.proofStatus === "rejected" ||
    (isCompleted && completion.proofStatus === "not_submitted");

  if (!isCompleted && !isPending && !hasProblem) {
    return null; // Nothing to show for non-completed projects
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        isFullyClosed
          ? "bg-emerald-500/10 border-emerald-500/30"
          : hasProblem
            ? "bg-red-500/10 border-red-500/30"
            : "bg-amber-500/10 border-amber-500/30"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">
          {isFullyClosed ? "✅" : hasProblem ? "⚠️" : "⏳"}
        </span>
        <div>
          <h4
            className={`font-semibold ${
              isFullyClosed
                ? "text-emerald-400"
                : hasProblem
                  ? "text-red-400"
                  : "text-amber-400"
            }`}
          >
            {isFullyClosed
              ? "Project Complete & Paid"
              : hasProblem
                ? "Project Requires Attention"
                : "Project Completion Pending"}
          </h4>
          {projectTitle && (
            <p className="text-sm text-slate-400">{projectTitle}</p>
          )}
        </div>
      </div>

      {showFullDetails && (
        <div className="space-y-2">
          {/* Proof Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Proof of Work:</span>
            <span
              className={`px-2 py-0.5 rounded ${
                completion.proofStatus === "approved"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : completion.proofStatus === "rejected"
                    ? "bg-red-500/20 text-red-400"
                    : completion.proofStatus === "pending"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-slate-700/50 text-slate-500"
              }`}
            >
              {completion.proofStatus === "not_submitted"
                ? "Not Submitted"
                : completion.proofStatus.charAt(0).toUpperCase() +
                  completion.proofStatus.slice(1)}
            </span>
          </div>

          {/* Rejection Reason */}
          {completion.proofRejectionReason && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded px-2 py-1">
              Rejection: {completion.proofRejectionReason}
            </p>
          )}

          {/* Payout Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Payout Status:</span>
            <span
              className={`px-2 py-0.5 rounded ${
                completion.payoutStatus === "credited"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : completion.payoutStatus === "pending"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-slate-700/50 text-slate-500"
              }`}
            >
              {completion.payoutStatus === "not_applicable"
                ? "N/A"
                : completion.payoutStatus.charAt(0).toUpperCase() +
                  completion.payoutStatus.slice(1)}
            </span>
          </div>

          {/* Earnings Credited */}
          {completion.payoutStatus === "credited" && (
            <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700/50">
              <span className="text-slate-400">Earnings Credited:</span>
              <span className="text-emerald-400 font-semibold">
                ${completion.earningsCredited.toFixed(2)}
              </span>
            </div>
          )}

          {/* Credit Date */}
          {completion.creditedAt && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Credited On:</span>
              <span className="text-slate-400">
                {new Date(completion.creditedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Summary message */}
      <p className="text-xs text-slate-400 mt-3">
        {isFullyClosed
          ? "This project is fully closed. Worker has been paid."
          : hasProblem
            ? "Action required to resolve completion issues."
            : "Awaiting proof approval or payout processing."}
      </p>
    </div>
  );
}

/**
 * Compact badge for list views
 */
export function CompletionStatusBadge({
  proofStatus,
  payoutStatus,
}: {
  proofStatus: string;
  payoutStatus: string;
}) {
  const isComplete = proofStatus === "approved" && payoutStatus === "credited";
  const hasProblem = proofStatus === "rejected";
  const isPending = proofStatus === "pending" || payoutStatus === "pending";

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${
        isComplete
          ? "bg-emerald-500/20 text-emerald-400"
          : hasProblem
            ? "bg-red-500/20 text-red-400"
            : isPending
              ? "bg-amber-500/20 text-amber-400"
              : "bg-slate-700/50 text-slate-500"
      }`}
    >
      {isComplete
        ? "✅ Paid"
        : hasProblem
          ? "⚠️ Issue"
          : isPending
            ? "⏳ Pending"
            : "—"}
    </span>
  );
}

/**
 * Helper to derive completion data from project and proof
 */
export function deriveCompletionData(
  project: any,
  proof: any,
  walletTransaction?: any,
): CompletionData {
  return {
    proofStatus: !proof
      ? "not_submitted"
      : proof.status === "approved"
        ? "approved"
        : proof.status === "rejected"
          ? "rejected"
          : "pending",
    payoutStatus: walletTransaction?.credited
      ? "credited"
      : proof?.status === "approved"
        ? "pending"
        : "not_applicable",
    earningsCredited:
      walletTransaction?.amount || project?.earningsCredited || 0,
    creditedAt: walletTransaction?.createdAt || project?.creditedAt,
    proofRejectionReason: proof?.rejectionReason,
    projectCompletedAt: project?.completedAt,
  };
}

export default ProjectCompletionConfirmation;
