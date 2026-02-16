"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WorkerData } from "./WorkerPipelineCard";

/**
 * PATCH_60: Worker Timeline Modal
 * Shows the full history and actions for a worker
 */

interface TimelineEvent {
  date: string;
  action: string;
  description: string;
  type: "status" | "project" | "payment" | "note";
}

interface WorkerTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerData | null;
  onAction: (action: string, workerId: string, data?: any) => void;
  actionLoading?: string | null;
}

// Map workerStatus to timeline position (1-8 scale)
const STATUS_POSITIONS: Record<string, number> = {
  applied: 1,
  screening_unlocked: 2,
  training_viewed: 2.5,
  test_submitted: 3,
  failed: 3,
  ready_to_work: 4,
  assigned: 5,
  working: 6,
  suspended: 0,
  inactive: 0,
};

export default function WorkerTimelineModal({
  isOpen,
  onClose,
  worker,
  onAction,
  actionLoading,
}: WorkerTimelineModalProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "actions">(
    "timeline",
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !worker) return null;

  const workerName = worker.userId
    ? `${worker.userId.firstName || ""} ${worker.userId.lastName || ""}`.trim() ||
      worker.userId.email
    : "Unknown Worker";

  const workerStatus = worker.workerStatus || "applied";
  const position = STATUS_POSITIONS[workerStatus] || 1;
  const progressPercent = Math.min((position / 6) * 100, 100);

  // Generate timeline events from worker data
  const generateTimeline = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    events.push({
      date: new Date(worker.createdAt).toLocaleDateString(),
      action: "Applied",
      description: `Applied for ${worker.positionTitle || worker.position?.title || "position"}`,
      type: "status",
    });

    if (worker.status === "approved") {
      events.push({
        date: new Date(worker.createdAt).toLocaleDateString(),
        action: "Approved",
        description: "Application was approved by admin",
        type: "status",
      });
    }

    if (
      [
        "screening_unlocked",
        "training_viewed",
        "test_submitted",
        "ready_to_work",
        "assigned",
        "working",
      ].includes(workerStatus)
    ) {
      events.push({
        date: "—",
        action: "Screening Unlocked",
        description: "Training materials and screening test available",
        type: "status",
      });
    }

    if (
      ["test_submitted", "ready_to_work", "assigned", "working"].includes(
        workerStatus,
      )
    ) {
      events.push({
        date: "—",
        action: "Test Submitted",
        description: `Screening test submitted (Attempt ${worker.attemptCount || 1}/${worker.maxAttempts || 2})`,
        type: "status",
      });
    }

    if (["ready_to_work", "assigned", "working"].includes(workerStatus)) {
      events.push({
        date: "—",
        action: "Ready to Work",
        description: "Passed screening, ready for project assignment",
        type: "status",
      });
    }

    if (worker.currentProject) {
      events.push({
        date: "—",
        action: "Project Assigned",
        description: `Working on: ${worker.currentProject.title}`,
        type: "project",
      });
    }

    if ((worker.totalEarnings || 0) > 0) {
      events.push({
        date: "—",
        action: "Earnings Credited",
        description: `Total: $${(worker.totalEarnings || 0).toFixed(2)}`,
        type: "payment",
      });
    }

    return events.reverse();
  };

  const timeline = generateTimeline();

  // Available actions based on current status
  const getAvailableActions = () => {
    const actions: {
      id: string;
      label: string;
      icon: string;
      color: string;
      destructive?: boolean;
    }[] = [];

    switch (workerStatus) {
      case "applied":
        actions.push({
          id: "approve",
          label: "Approve Application",
          icon: "✓",
          color: "bg-emerald-600",
        });
        actions.push({
          id: "reject",
          label: "Reject Application",
          icon: "✗",
          color: "bg-red-600",
          destructive: true,
        });
        break;
      case "screening_unlocked":
      case "training_viewed":
        actions.push({
          id: "set_ready",
          label: "Skip Screening → Ready",
          icon: "⏭",
          color: "bg-amber-600",
        });
        break;
      case "test_submitted":
        actions.push({
          id: "mark_passed",
          label: "Pass Screening",
          icon: "✓",
          color: "bg-emerald-600",
        });
        actions.push({
          id: "mark_failed",
          label: "Fail Screening",
          icon: "✗",
          color: "bg-red-600",
          destructive: true,
        });
        break;
      case "failed":
        actions.push({
          id: "reset_attempts",
          label: "Reset & Allow Retry",
          icon: "Retry",
          color: "bg-amber-600",
        });
        break;
      case "ready_to_work":
        actions.push({
          id: "assign_project",
          label: "Assign Project",
          icon: "Assign",
          color: "bg-blue-600",
        });
        break;
      case "suspended":
        actions.push({
          id: "reactivate",
          label: "Reactivate Worker",
          icon: "✓",
          color: "bg-emerald-600",
        });
        break;
    }

    // Always available actions
    if (!["suspended", "inactive"].includes(workerStatus)) {
      actions.push({
        id: "suspend",
        label: "Suspend Worker",
        icon: "⛔",
        color: "bg-red-600",
        destructive: true,
      });
    }

    return actions;
  };

  const availableActions = getAvailableActions();
  const isLoading = actionLoading === worker.applicationId;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-white/10"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{workerName}</h2>
                  <p className="text-sm text-slate-400">
                    {worker.userId?.email}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {worker.positionTitle ||
                      worker.position?.title ||
                      "No Position"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Applied</span>
                  <span>Screening</span>
                  <span>Ready</span>
                  <span>Working</span>
                  <span>Complete</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === "timeline"
                    ? "text-white border-b-2 border-blue-500"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab("actions")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === "actions"
                    ? "text-white border-b-2 border-blue-500"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ⚡ Actions
              </button>
            </div>

            {/* Content */}
            <div className="p-5 max-h-[50vh] overflow-y-auto">
              {activeTab === "timeline" && (
                <div className="space-y-4">
                  {timeline.map((event, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="text-xs text-slate-500 w-20 shrink-0">
                        {event.date}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {event.action}
                        </p>
                        <p className="text-xs text-slate-400">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "actions" && (
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : availableActions.length > 0 ? (
                    availableActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() =>
                          onAction(action.id, worker.applicationId)
                        }
                        className={`w-full flex items-center gap-3 p-3 rounded-xl ${action.color} ${
                          action.destructive
                            ? "hover:opacity-80"
                            : "hover:opacity-90"
                        } transition-opacity`}
                      >
                        <span className="text-lg">{action.icon}</span>
                        <span className="font-medium text-white">
                          {action.label}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 py-4">
                      No actions available for this status
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer Stats */}
            <div className="p-4 bg-white/5 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-emerald-400">
                  ${(worker.totalEarnings || 0).toFixed(2)}
                </p>
                <p className="text-xs text-slate-400">Total Earned</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-400">
                  ${(worker.pendingEarnings || 0).toFixed(2)}
                </p>
                <p className="text-xs text-slate-400">Pending</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-400">
                  {worker.attemptCount || 0}/{worker.maxAttempts || 2}
                </p>
                <p className="text-xs text-slate-400">Attempts</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
