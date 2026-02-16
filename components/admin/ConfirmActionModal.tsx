"use client";

import React, { useState } from "react";

/**
 * PATCH-64: Safety Guardrail Confirmation Modal
 * For ALL critical admin actions that affect money, status, or access
 * Uses simple text tokens for compatibility (no external icon library)
 */

export type ActionType =
  | "payment_verify"
  | "wallet_credit"
  | "wallet_debit"
  | "worker_approve"
  | "worker_reject"
  | "worker_status_change"
  | "project_assign"
  | "screening_save"
  | "affiliate_withdrawal_approve"
  | "affiliate_withdrawal_reject"
  | "generic";

interface ActionDetails {
  // For display
  entityId?: string;
  entityName?: string;
  currentState?: string;
  targetState?: string;

  // For wallet actions
  currentBalance?: number;
  adjustmentAmount?: number;
  resultingBalance?: number;

  // For worker actions
  workerName?: string;
  workerEmail?: string;
  screeningStatus?: string;

  // For project assignment
  projectName?: string;
  workerCategory?: string;
  projectCategory?: string;

  // For affiliate
  affiliateBalance?: number;
  withdrawalAmount?: number;
}

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  actionType: ActionType;
  title: string;
  description: string;
  details?: ActionDetails;
  warningMessage?: string;
  requireReason?: boolean;
  onReasonChange?: (reason: string) => void;
  confirmButtonText?: string;
  isDangerous?: boolean;
}

// Lightweight icon tokens for each action type (no external library needed)
const ACTION_ICONS: Record<ActionType, string> = {
  payment_verify: "Pay",
  wallet_credit: "Credit",
  wallet_debit: "Debit",
  worker_approve: "Worker",
  worker_reject: "Block",
  worker_status_change: "Change",
  project_assign: "Assign",
  screening_save: "Save",
  affiliate_withdrawal_approve: "Approve",
  affiliate_withdrawal_reject: "Reject",
  generic: "Guard",
};

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  title,
  description,
  details,
  warningMessage,
  requireReason = false,
  onReasonChange,
  confirmButtonText = "Confirm",
  isDangerous = false,
}: ConfirmActionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      setError("Reason is required for this action");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Action failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReasonChange = (value: string) => {
    setReason(value);
    onReasonChange?.(value);
  };

  const iconColor = isDangerous ? "text-red-400" : "text-amber-400";
  const confirmBtnColor = isDangerous
    ? "bg-red-600 hover:bg-red-700"
    : "bg-emerald-600 hover:bg-emerald-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-zinc-700">
          <div className={`p-2 rounded-lg bg-zinc-800 ${iconColor} text-xl`}>
            {ACTION_ICONS[actionType]}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-zinc-400">Confirm this action</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Description */}
          <p className="text-zinc-300">{description}</p>

          {/* Details Panel */}
          {details && (
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2 border border-zinc-700/50">
              {details.entityId && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">ID:</span>
                  <span className="text-white font-mono">
                    {details.entityId}
                  </span>
                </div>
              )}
              {details.entityName && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Name:</span>
                  <span className="text-white">{details.entityName}</span>
                </div>
              )}
              {details.currentState && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Current Status:</span>
                  <span className="text-amber-400">{details.currentState}</span>
                </div>
              )}
              {details.targetState && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">New Status:</span>
                  <span className="text-emerald-400">
                    {details.targetState}
                  </span>
                </div>
              )}

              {/* Wallet-specific details */}
              {details.currentBalance !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Current Balance:</span>
                  <span className="text-white">
                    ${details.currentBalance.toFixed(2)}
                  </span>
                </div>
              )}
              {details.adjustmentAmount !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Adjustment:</span>
                  <span
                    className={
                      actionType === "wallet_credit"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {actionType === "wallet_credit" ? "+" : "-"}$
                    {details.adjustmentAmount.toFixed(2)}
                  </span>
                </div>
              )}
              {details.resultingBalance !== undefined && (
                <div className="flex justify-between text-sm border-t border-zinc-600 pt-2 mt-2">
                  <span className="text-zinc-400 font-medium">
                    Resulting Balance:
                  </span>
                  <span
                    className={`font-bold ${
                      details.resultingBalance < 0
                        ? "text-red-500"
                        : "text-white"
                    }`}
                  >
                    ${details.resultingBalance.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Worker-specific details */}
              {details.workerName && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Worker:</span>
                  <span className="text-white">{details.workerName}</span>
                </div>
              )}
              {details.workerEmail && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Email:</span>
                  <span className="text-zinc-300">{details.workerEmail}</span>
                </div>
              )}
              {details.screeningStatus && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Screening:</span>
                  <span className="text-amber-400">
                    {details.screeningStatus}
                  </span>
                </div>
              )}

              {/* Project assignment details */}
              {details.projectName && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Project:</span>
                  <span className="text-white">{details.projectName}</span>
                </div>
              )}
              {details.workerCategory && details.projectCategory && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Category Match:</span>
                  <span
                    className={
                      details.workerCategory === details.projectCategory
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {details.workerCategory === details.projectCategory
                      ? "✓ Match"
                      : "✗ Mismatch"}
                  </span>
                </div>
              )}

              {/* Affiliate withdrawal details */}
              {details.affiliateBalance !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Affiliate Balance:</span>
                  <span className="text-white">
                    ${details.affiliateBalance.toFixed(2)}
                  </span>
                </div>
              )}
              {details.withdrawalAmount !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Withdrawal Amount:</span>
                  <span className="text-amber-400">
                    ${details.withdrawalAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          {warningMessage && (
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <span className="text-amber-500 flex-shrink-0 text-lg">!</span>
              <p className="text-sm text-amber-200">{warningMessage}</p>
            </div>
          )}

          {/* Reason input */}
          {requireReason && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Reason (required)
              </label>
              <textarea
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                placeholder="Enter reason for this action..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                rows={3}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-zinc-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${confirmBtnColor} disabled:opacity-50`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>✓</span>
            )}
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmActionModal;
