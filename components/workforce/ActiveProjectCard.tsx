"use client";

import React from "react";
import Link from "next/link";

/**
 * PATCH-65.1: Active Project Card
 *
 * Displays the current active project for a worker with full clarity:
 * - Project name, status, pay rate
 * - Assigned date
 * - Project → Proof → Payout mini-timeline
 *
 * RULE: A worker must NEVER appear "assigned" without a visible project
 */

interface ProjectData {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  status: string;
  payRate?: number;
  payType?: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  deadline?: string;
}

interface ProofData {
  _id: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface EarningsData {
  credited: boolean;
  amount?: number;
  creditedAt?: string;
}

interface ActiveProjectCardProps {
  project: ProjectData | null | undefined;
  workerStatus: string;
  proof?: ProofData | null;
  earnings?: EarningsData | null;
  onViewProject?: () => void;
}

// Project status progression
const PROJECT_TIMELINE_STEPS = [
  {
    id: "assigned",
    label: "Assigned",
    icon: "Step",
    description: "Project assigned to worker",
  },
  {
    id: "started",
    label: "Started",
    icon: "Go",
    description: "Work in progress",
  },
  {
    id: "proof_submitted",
    label: "Proof Submitted",
    icon: "Proof",
    description: "Waiting for review",
  },
  {
    id: "approved",
    label: "Approved",
    icon: "OK",
    description: "Proof accepted",
  },
  {
    id: "credited",
    label: "Credited",
    icon: "$",
    description: "Earnings credited",
  },
];

function getProjectProgress(
  project: ProjectData | null,
  proof: ProofData | null | undefined,
  earnings: EarningsData | null | undefined,
): number {
  if (!project) return -1;
  if (earnings?.credited) return 4; // Fully complete
  if (proof?.status === "approved") return 3;
  if (proof?.status === "pending" || proof?.status === "submitted") return 2;
  if (project.status === "in_progress" || project.status === "working")
    return 1;
  if (project.status === "assigned") return 0;
  return 0;
}

export function ActiveProjectCard({
  project,
  workerStatus,
  proof,
  earnings,
  onViewProject,
}: ActiveProjectCardProps) {
  const currentStep = getProjectProgress(project || null, proof, earnings);

  // Worker is assigned but no project visible - WARNING STATE
  if ((workerStatus === "assigned" || workerStatus === "working") && !project) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">!</span>
          <div>
            <h3 className="text-lg font-semibold text-red-400">
              Project Data Missing
            </h3>
            <p className="text-sm text-red-300/70">
              Worker is marked as "{workerStatus}" but no active project is
              visible.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          This may indicate a data inconsistency. Check the Projects tab or
          database.
        </p>
      </div>
    );
  }

  // Worker is not in project-related status
  if (
    !["assigned", "working", "proof_submitted", "completed"].includes(
      workerStatus,
    ) &&
    !project
  ) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl opacity-50">Info</span>
          <div>
            <h3 className="text-lg font-semibold text-slate-400">
              No Active Project
            </h3>
            <p className="text-sm text-slate-500">
              {workerStatus === "ready_to_work"
                ? "Worker is ready for a project assignment."
                : "Worker must complete screening before project assignment."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">Proj</span>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {project.title}
              </h3>
              <p className="text-sm text-slate-400">
                {project.category} • ${project.payRate || 0}/
                {project.payType || "task"}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              project.status === "completed"
                ? "bg-emerald-500/20 text-emerald-400"
                : project.status === "in_progress"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-cyan-500/20 text-cyan-400"
            }`}
          >
            {project.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Key Dates */}
        <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
          <div className="bg-slate-900/50 rounded-lg p-2.5">
            <p className="text-slate-500">Assigned</p>
            <p className="text-white font-medium">
              {project.assignedAt
                ? new Date(project.assignedAt).toLocaleDateString()
                : "—"}
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2.5">
            <p className="text-slate-500">Deadline</p>
            <p className="text-white font-medium">
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString()
                : "—"}
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2.5">
            <p className="text-slate-500">Pay Rate</p>
            <p className="text-emerald-400 font-medium">
              ${project.payRate || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Project → Proof → Payout Timeline */}
      <div className="p-4 bg-slate-900/30">
        <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide">
          Completion Progress
        </p>
        <div className="flex items-center justify-between gap-1">
          {PROJECT_TIMELINE_STEPS.map((step, index) => {
            const isCompleted = index <= currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <React.Fragment key={step.id}>
                {/* Step indicator */}
                <div className="flex flex-col items-center group relative">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                      isCompleted
                        ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500"
                        : isCurrent
                          ? "bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500 animate-pulse"
                          : "bg-slate-700/50 text-slate-500 border border-slate-600"
                    }`}
                  >
                    {isCompleted ? "✓" : step.icon}
                  </div>
                  <p
                    className={`text-[10px] mt-1 text-center ${
                      isCompleted
                        ? "text-emerald-400"
                        : isCurrent
                          ? "text-cyan-400 font-medium"
                          : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </p>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {step.description}
                  </div>
                </div>

                {/* Connector line */}
                {index < PROJECT_TIMELINE_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      index < currentStep ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Proof Status (if exists) */}
        {proof && (
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Proof:</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    proof.status === "approved"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : proof.status === "rejected"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {proof.status}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {new Date(proof.createdAt).toLocaleDateString()}
              </span>
            </div>
            {proof.rejectionReason && (
              <p className="text-xs text-red-400 mt-1">
                Rejection: {proof.rejectionReason}
              </p>
            )}
          </div>
        )}

        {/* Earnings Credited (if applicable) */}
        {earnings?.credited && (
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">Earnings Credited:</span>
              <span className="text-emerald-400 font-medium">
                ${earnings.amount?.toFixed(2) || "0.00"}
              </span>
            </div>
            {earnings.creditedAt && (
              <span className="text-xs text-slate-500">
                {new Date(earnings.creditedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* View Project Link */}
      {onViewProject && (
        <div className="p-3 border-t border-slate-700/50 bg-slate-800/30">
          <button
            onClick={onViewProject}
            className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg text-sm transition flex items-center justify-center gap-2"
          >
            View Project Details
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for list views
 */
export function ActiveProjectBadge({
  project,
  workerStatus,
}: {
  project: ProjectData | null | undefined;
  workerStatus: string;
}) {
  // Warning state
  if ((workerStatus === "assigned" || workerStatus === "working") && !project) {
    return (
      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs flex items-center gap-1">
        ! No project
      </span>
    );
  }

  if (!project) {
    return (
      <span className="px-2 py-1 bg-slate-700/50 text-slate-500 rounded text-xs">
        No active project
      </span>
    );
  }

  return (
    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs flex items-center gap-1 max-w-[150px] truncate">
      Proj {project.title}
    </span>
  );
}

export default ActiveProjectCard;
