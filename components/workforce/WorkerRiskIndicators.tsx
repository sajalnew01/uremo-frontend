"use client";

import React from "react";

/**
 * PATCH-65: Worker Risk & Signal Indicators
 *
 * Visual indicators showing worker risks and signals at a glance.
 * Uses ONLY existing data - no new metrics calculated.
 *
 * Signals:
 * - ⚠️ Failed screening
 * - ⏳ Stuck in same state > X days
 * - 🚫 Previously suspended
 * - 📉 No completed projects
 * - 🧪 Screening incomplete or invalid
 */

interface WorkerRiskIndicatorsProps {
  workerStatus: string;
  applicationStatus?: string;
  isFailed?: boolean;
  isSuspended?: boolean;
  wasSuspended?: boolean;
  attemptCount?: number;
  maxAttempts?: number;
  projectsCompleted?: number;
  createdAt?: string;
  updatedAt?: string;
  screeningsCompleted?: number;
  testSubmittedAt?: string;
  size?: "sm" | "md";
  inline?: boolean;
}

// Calculate days since a date
function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function WorkerRiskIndicators({
  workerStatus,
  applicationStatus,
  isFailed = false,
  isSuspended = false,
  wasSuspended = false,
  attemptCount = 0,
  maxAttempts = 2,
  projectsCompleted = 0,
  createdAt,
  updatedAt,
  screeningsCompleted = 0,
  testSubmittedAt,
  size = "md",
  inline = false,
}: WorkerRiskIndicatorsProps) {
  const signals: Array<{
    icon: string;
    label: string;
    tooltip: string;
    severity: "error" | "warning" | "info";
  }> = [];

  // ⚠️ Failed screening
  if (isFailed || workerStatus === "failed") {
    signals.push({
      icon: "⚠️",
      label: "Failed Screening",
      tooltip: `Failed screening test (Attempt ${attemptCount}/${maxAttempts})`,
      severity: "error",
    });
  }

  // 🚫 Currently suspended
  if (isSuspended || workerStatus === "suspended") {
    signals.push({
      icon: "🚫",
      label: "Suspended",
      tooltip: "Worker account is currently suspended",
      severity: "error",
    });
  }

  // 🔄 Previously suspended (if not currently suspended)
  if (wasSuspended && !isSuspended && workerStatus !== "suspended") {
    signals.push({
      icon: "🔄",
      label: "Was Suspended",
      tooltip: "This worker was previously suspended",
      severity: "warning",
    });
  }

  // ⏳ Stuck in same state > 14 days
  const daysInState = daysSince(updatedAt || createdAt);
  const stuckThreshold = 14;
  if (
    daysInState > stuckThreshold &&
    !["working", "completed", "suspended"].includes(workerStatus)
  ) {
    signals.push({
      icon: "⏳",
      label: `${daysInState}d Stuck`,
      tooltip: `Worker has been in "${workerStatus}" state for ${daysInState} days`,
      severity: "warning",
    });
  }

  // 📉 No completed projects (only for ready_to_work or higher)
  const activeStatuses = ["ready_to_work", "assigned", "working"];
  if (activeStatuses.includes(workerStatus) && projectsCompleted === 0) {
    signals.push({
      icon: "📉",
      label: "No Projects",
      tooltip: "Worker has not completed any projects yet",
      severity: "info",
    });
  }

  // 🧪 Screening incomplete (only relevant for early stages)
  if (
    workerStatus === "screening_unlocked" ||
    workerStatus === "training_viewed"
  ) {
    const daysSinceUnlock = daysSince(updatedAt || createdAt);
    if (daysSinceUnlock > 7) {
      signals.push({
        icon: "🧪",
        label: "Screening Pending",
        tooltip: `Screening unlocked ${daysSinceUnlock} days ago but not completed`,
        severity: "warning",
      });
    }
  }

  // 🔁 Multiple screening attempts
  if (attemptCount > 1 && attemptCount < maxAttempts) {
    signals.push({
      icon: "🔁",
      label: `Attempt ${attemptCount}`,
      tooltip: `Worker is on screening attempt ${attemptCount} of ${maxAttempts}`,
      severity: "info",
    });
  }

  // 🚨 Last attempt remaining
  if (attemptCount === maxAttempts - 1 && workerStatus === "test_submitted") {
    signals.push({
      icon: "🚨",
      label: "Last Attempt",
      tooltip: "This is the worker's final screening attempt",
      severity: "warning",
    });
  }

  // 📋 Pending application
  if (workerStatus === "applied" && applicationStatus === "pending") {
    const daysPending = daysSince(createdAt);
    if (daysPending > 3) {
      signals.push({
        icon: "📋",
        label: `${daysPending}d Pending`,
        tooltip: `Application pending for ${daysPending} days`,
        severity: "info",
      });
    }
  }

  if (signals.length === 0) {
    return null;
  }

  const severityColors = {
    error: "bg-red-500/20 text-red-400 border-red-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
  };

  if (inline) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {signals.map((signal, i) => (
          <span
            key={i}
            className={`inline-flex items-center rounded-full border ${severityColors[signal.severity]} ${sizeClasses[size]}`}
            title={signal.tooltip}
          >
            <span>{signal.icon}</span>
            {size === "md" && <span>{signal.label}</span>}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {signals.map((signal, i) => (
        <div
          key={i}
          className={`group relative inline-flex items-center rounded-lg border ${severityColors[signal.severity]} ${sizeClasses[size]}`}
        >
          <span>{signal.icon}</span>
          <span>{signal.label}</span>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-[180px] text-center">
            <p className="text-xs text-slate-300">{signal.tooltip}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Compact version for list views - just shows icons
 */
export function WorkerRiskBadges({
  workerStatus,
  isFailed,
  isSuspended,
  wasSuspended,
  projectsCompleted = 0,
  updatedAt,
  createdAt,
}: Pick<
  WorkerRiskIndicatorsProps,
  | "workerStatus"
  | "isFailed"
  | "isSuspended"
  | "wasSuspended"
  | "projectsCompleted"
  | "updatedAt"
  | "createdAt"
>) {
  const badges: string[] = [];

  if (isFailed || workerStatus === "failed") badges.push("⚠️");
  if (isSuspended || workerStatus === "suspended") badges.push("🚫");
  if (wasSuspended && !isSuspended) badges.push("🔄");

  const daysInState = daysSince(updatedAt || createdAt);
  if (
    daysInState > 14 &&
    !["working", "completed", "suspended"].includes(workerStatus)
  ) {
    badges.push("⏳");
  }

  if (badges.length === 0) return null;

  return (
    <span className="text-sm" title="Risk indicators">
      {badges.join(" ")}
    </span>
  );
}

export default WorkerRiskIndicators;
