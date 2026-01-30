"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/useToast";

/**
 * PATCH_43: Worker Journey Engine - Enhanced Workspace Page
 * PATCH_46: Workspace UX + Job Flow Clarity Upgrade
 * Multi-job support with independent status per job role
 * States: Applied → Screening Unlocked → Training Viewed → Test Submitted → Ready To Work → Assigned → Working
 */

type TrainingMaterial = {
  title: string;
  type: "link" | "pdf" | "video";
  url: string;
  description?: string;
};

type Position = {
  _id: string;
  title: string;
  category: string;
  description?: string;
  trainingMaterials?: TrainingMaterial[];
  hasScreening?: boolean;
};

type Screening = {
  _id: string;
  title: string;
  description?: string;
  timeLimit: number;
  passingScore: number;
  trainingMaterials?: TrainingMaterial[];
};

type Project = {
  _id: string;
  title: string;
  description?: string;
  payRate: number;
  payType: string;
  deadline?: string;
  status: string;
};

type JobApplication = {
  _id: string;
  position: Position;
  positionTitle: string;
  category: string;
  workerStatus:
    | "applied"
    | "screening_unlocked"
    | "training_viewed"
    | "test_submitted"
    | "failed"
    | "ready_to_work"
    | "assigned"
    | "working"
    | "suspended";
  applicationStatus: "pending" | "approved" | "rejected";
  attemptCount: number;
  maxAttempts: number;
  totalEarnings: number;
  pendingEarnings: number;
  payRate: number;
  screening?: Screening;
  trainingMaterials: TrainingMaterial[];
  assignedProjects: Project[];
  completedProjects: Project[];
  screeningsCompleted: any[];
  adminMessage?: string; // PATCH_46: Optional admin message
  createdAt: string;
};

// PATCH_45: Support both old (profile) and new (applications) API formats
type LegacyProfile = {
  _id: string;
  workerStatus: string;
  status: string;
  totalEarnings: number;
  pendingEarnings: number;
  payRate: number;
  screeningsCompleted: any[];
  createdAt: string;
};

type WorkspaceData = {
  hasProfile: boolean;
  // New format (PATCH_43)
  applications?: JobApplication[];
  // Legacy format (pre-PATCH_43)
  profile?: LegacyProfile;
  availableScreenings?: any[];
  assignedProjects?: any[];
  completedProjects?: any[];
  stats: {
    totalEarnings: number;
    pendingEarnings: number;
    projectsCompleted: number;
    jobsApplied?: number;
    screeningsCompleted?: number;
  };
  message?: string;
};

// PATCH_43 + PATCH_46: Authoritative status configuration with human-friendly messages
const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    humanMessage: string;
    color: string;
    icon: string;
    description: string;
  }
> = {
  applied: {
    label: "Applied",
    humanMessage: "Application Received",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    icon: "📝",
    description: "Your application is under review",
  },
  screening_unlocked: {
    label: "Training Available",
    humanMessage: "Training Available",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: "📚",
    description: "Review training materials to proceed",
  },
  training_viewed: {
    label: "Ready for Test",
    humanMessage: "Training Completed",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    icon: "✅",
    description: "You can now take the screening test",
  },
  test_submitted: {
    label: "Test Submitted",
    humanMessage: "Test Submitted",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: "📤",
    description: "Awaiting result from admin",
  },
  failed: {
    label: "Test Failed",
    humanMessage: "Test Failed – Retry Available",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: "❌",
    description: "You can retry the test",
  },
  ready_to_work: {
    label: "Ready To Work",
    humanMessage: "Ready To Work",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: "✅",
    description: "Waiting for project assignment",
  },
  assigned: {
    label: "Assigned",
    humanMessage: "Project Assigned",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: "💼",
    description: "You have an active project",
  },
  working: {
    label: "Working",
    humanMessage: "Working",
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    icon: "⚡",
    description: "Project in progress",
  },
  completed: {
    label: "Completed",
    humanMessage: "Work Completed",
    color: "bg-green-500/20 text-green-300 border-green-500/30",
    icon: "🏆",
    description: "Work successfully completed",
  },
  suspended: {
    label: "Suspended",
    humanMessage: "Account Suspended",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: "⏸️",
    description: "Contact support for assistance",
  },
  // Legacy fallbacks
  fresh: {
    label: "Applied",
    humanMessage: "Application Received",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    icon: "📝",
    description: "Waiting for admin review",
  },
  screening_available: {
    label: "Training Available",
    humanMessage: "Training Available",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: "📚",
    description: "Complete training to proceed",
  },
  inactive: {
    label: "Suspended",
    humanMessage: "Account Suspended",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: "⏸️",
    description: "Account suspended",
  },
};

// PATCH_46: Updated journey steps with training_viewed
const JOURNEY_STEPS = [
  "applied",
  "screening_unlocked",
  "training_viewed",
  "ready_to_work",
  "assigned",
  "working",
];

// PATCH_46: Status to CTA button mapping
function getStatusCTA(app: JobApplication): {
  text: string;
  action: string | null;
  href?: string;
  disabled?: boolean;
} {
  const attemptsLeft = app.maxAttempts - app.attemptCount;

  switch (app.workerStatus) {
    case "applied":
      return {
        text: "⏳ Waiting for Admin Approval",
        action: null,
        disabled: true,
      };
    case "screening_unlocked":
      return { text: "📚 Start Training", action: "training", href: undefined };
    case "training_viewed":
      return {
        text: "📝 Take Screening Test",
        action: "test",
        href: app.screening
          ? `/workspace/screening/${app.screening._id}?position=${app._id}`
          : undefined,
      };
    case "test_submitted":
      return { text: "⏳ Awaiting Result", action: null, disabled: true };
    case "failed":
      if (attemptsLeft > 0) {
        return {
          text: `🔄 Retry Test (${attemptsLeft} Attempt${attemptsLeft > 1 ? "s" : ""} Left)`,
          action: "retry",
          href: app.screening
            ? `/workspace/screening/${app.screening._id}?position=${app._id}`
            : undefined,
        };
      }
      return {
        text: "⏳ Waiting for Admin Reset",
        action: null,
        disabled: true,
      };
    case "ready_to_work":
      return {
        text: "⏳ Waiting For Project Assignment",
        action: null,
        disabled: true,
      };
    case "assigned":
      return {
        text: "📂 Open Project",
        action: "project",
        href: app.assignedProjects?.[0]
          ? `/workspace/project/${app.assignedProjects[0]._id}`
          : undefined,
      };
    case "working":
      return {
        text: "📤 Submit Work",
        action: "submit",
        href: app.assignedProjects?.[0]
          ? `/workspace/project/${app.assignedProjects[0]._id}`
          : undefined,
      };
    case "suspended":
      return { text: "❌ Account Suspended", action: null, disabled: true };
    default:
      return { text: "View Details", action: null };
  }
}

// PATCH_46: Enhanced JobCard with dynamic CTAs and human-friendly UX
function JobCard({ app }: { app: JobApplication }) {
  const status = STATUS_CONFIG[app.workerStatus] || STATUS_CONFIG.applied;
  const currentStepIdx = JOURNEY_STEPS.indexOf(app.workerStatus);
  const cta = getStatusCTA(app);
  const [trainingViewed, setTrainingViewed] = useState(false);

  // Mark training as viewed
  const handleViewTraining = async () => {
    setTrainingViewed(true);
    // In a real implementation, this would call the API to update status
    // For now, just show the test button
  };

  return (
    <div className="card overflow-hidden">
      {/* Header with gradient accent */}
      <div
        className={`-mx-4 -mt-4 px-4 py-3 mb-4 ${status.color.replace("/20", "/10")}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${status.color}`}
            >
              {status.icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{app.positionTitle}</h3>
              <p className="text-sm text-slate-400">{app.category}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${status.color}`}
          >
            {status.humanMessage}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap gap-4 mb-4 text-center">
        <div className="flex-1 min-w-[80px]">
          <p className="text-xl font-bold text-emerald-400">
            ${app.totalEarnings.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400">Earned</p>
        </div>
        <div className="flex-1 min-w-[80px]">
          <p className="text-xl font-bold text-amber-400">
            ${app.pendingEarnings.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400">Pending</p>
        </div>
        {app.workerStatus === "failed" ||
        app.workerStatus === "screening_unlocked" ||
        app.workerStatus === "training_viewed" ? (
          <div className="flex-1 min-w-[80px]">
            <p className="text-xl font-bold text-purple-400">
              {app.maxAttempts - app.attemptCount}/{app.maxAttempts}
            </p>
            <p className="text-xs text-slate-400">Attempts Left</p>
          </div>
        ) : null}
      </div>

      {/* Progress Tracker */}
      <div className="mb-4 px-2">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {JOURNEY_STEPS.map((step, idx) => {
            const stepConfig = STATUS_CONFIG[step];
            const isCompleted = idx < currentStepIdx;
            const isCurrent = step === app.workerStatus;
            const isFailed = app.workerStatus === "failed" && idx === 2;

            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      isCompleted
                        ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500"
                        : isCurrent
                          ? `${stepConfig.color} border-2`
                          : isFailed
                            ? "bg-red-500/20 text-red-400 border-2 border-red-500"
                            : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}
                  >
                    {isCompleted ? "✓" : stepConfig?.icon || "•"}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 text-center max-w-[60px] truncate">
                    {stepConfig?.label || step}
                  </span>
                </div>
                {idx < JOURNEY_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Message (if any) */}
      {app.adminMessage && (
        <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-300">
            <span className="font-medium">📢 Admin Message:</span>{" "}
            {app.adminMessage}
          </p>
        </div>
      )}

      {/* Dynamic Action Area */}
      <div className="border-t border-white/10 pt-4">
        {/* Training Materials Section - Show when screening_unlocked */}
        {app.workerStatus === "screening_unlocked" &&
          !trainingViewed &&
          app.trainingMaterials &&
          app.trainingMaterials.length > 0 && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                <h4 className="font-medium text-amber-300 mb-2 flex items-center gap-2">
                  📚 Training Materials
                  <span className="text-xs bg-amber-500/30 px-2 py-0.5 rounded-full">
                    Required
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Review all materials before taking the test
                </p>
                <div className="space-y-2">
                  {app.trainingMaterials.map((m, i) => (
                    <a
                      key={i}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-amber-200 hover:text-amber-100 p-2 rounded-lg hover:bg-amber-500/10 transition"
                    >
                      {m.type === "video" && "🎥"}
                      {m.type === "pdf" && "📄"}
                      {m.type === "link" && "🔗"}
                      <span className="flex-1">{m.title}</span>
                      <span className="text-xs text-slate-500">→</span>
                    </a>
                  ))}
                </div>
              </div>
              <button
                onClick={handleViewTraining}
                className="w-full btn-primary"
              >
                ✅ I&apos;ve Completed Training
              </button>
            </div>
          )}

        {/* Take Test Button - Show after training viewed OR if training_viewed status */}
        {((app.workerStatus === "screening_unlocked" && trainingViewed) ||
          app.workerStatus === "training_viewed") &&
          app.screening && (
            <div className="text-center space-y-3">
              <p className="text-sm text-slate-400">
                You have {app.maxAttempts - app.attemptCount} attempt
                {app.maxAttempts - app.attemptCount !== 1 ? "s" : ""} remaining
              </p>
              <Link
                href={`/workspace/screening/${app.screening._id}?position=${app._id}`}
                className="btn-primary inline-flex items-center gap-2"
              >
                📝 Take Screening Test
              </Link>
              <p className="text-xs text-slate-500">
                ⏱️ {app.screening.timeLimit} min • 🎯 Pass:{" "}
                {app.screening.passingScore}%
              </p>
            </div>
          )}

        {/* Primary CTA Button for other statuses */}
        {app.workerStatus !== "screening_unlocked" &&
          app.workerStatus !== "training_viewed" && (
            <div className="text-center">
              {cta.href ? (
                <Link
                  href={cta.href}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
                    cta.disabled
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                  }`}
                >
                  {cta.text}
                </Link>
              ) : (
                <div
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium ${
                    cta.disabled
                      ? "bg-slate-700/50 text-slate-400"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {cta.text}
                </div>
              )}

              {/* Additional context for waiting states */}
              {app.workerStatus === "applied" && (
                <p className="text-xs text-slate-500 mt-3">
                  An admin will review your application soon
                </p>
              )}
              {app.workerStatus === "test_submitted" && (
                <p className="text-xs text-slate-500 mt-3">
                  Your test is being reviewed by an admin
                </p>
              )}
              {app.workerStatus === "ready_to_work" && (
                <p className="text-xs text-slate-500 mt-3">
                  You&apos;re approved! Waiting for a project assignment
                </p>
              )}
              {app.workerStatus === "failed" &&
                app.maxAttempts - app.attemptCount <= 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-2">
                      Contact admin to reset your attempts
                    </p>
                    <Link
                      href="/support"
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      📞 Contact Support
                    </Link>
                  </div>
                )}
            </div>
          )}

        {/* Active Projects */}
        {(app.workerStatus === "assigned" || app.workerStatus === "working") &&
          app.assignedProjects.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <h4 className="font-medium mb-3 text-sm">Active Projects</h4>
              <div className="space-y-2">
                {app.assignedProjects.map((p) => (
                  <Link
                    key={p._id}
                    href={`/workspace/project/${p._id}`}
                    className="block p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{p.title}</p>
                        <p className="text-xs text-slate-400">
                          ${p.payRate} / {p.payType}
                        </p>
                      </div>
                      <span className="text-blue-400 text-sm">Open →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        {/* Completed Projects Count */}
        {app.completedProjects.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              ✅ Completed: {app.completedProjects.length} project
              {app.completedProjects.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-emerald-400">
              Earned: ${app.totalEarnings.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    apiRequest("/api/workspace/profile", "GET")
      .then((response: any) => {
        if (!mounted) return;
        setData(response);
      })
      .catch((e: any) => {
        if (!mounted) return;
        const msg = e?.message || "Failed to load workspace";
        setError(msg);
        toast(msg, "error");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="u-container max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Workspace</h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">Work & Earn</p>
        </div>
        <div className="card animate-pulse">
          <div className="h-20 rounded-xl bg-white/10" />
        </div>
      </div>
    );
  }

  if (error) {
    // PATCH_46: Error Recovery UI with Retry, Home, and Support buttons
    return (
      <div className="u-container max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Workspace</h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">Work & Earn</p>
        </div>
        <div className="card text-center py-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-300 mb-2">
            Something went wrong
          </h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition"
            >
              🔄 Retry
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-500/20 text-slate-300 rounded-lg hover:bg-slate-500/30 transition"
            >
              🏠 Go Home
            </Link>
            <Link
              href="/support"
              className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition"
            >
              📞 Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No workspace profile - prompt to apply
  if (!data?.hasProfile) {
    return (
      <div className="u-container max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Workspace</h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">Work & Earn</p>
        </div>
        <EmptyState
          icon="💼"
          title="No Workspace Profile"
          description="Apply to a work position to get started. Complete screenings, get assigned projects, and earn money."
          ctaText="Browse Work Positions"
          ctaHref="/apply-to-work"
        />
      </div>
    );
  }

  const { applications, stats } = data;

  // PATCH_45: Convert legacy profile format to applications array format
  // Legacy format has a single profile object; new format has applications array
  const normalizedApplications: JobApplication[] = applications
    ? applications
    : data.profile
      ? [
          {
            _id: data.profile._id,
            position: {
              _id: "legacy",
              title: "Worker",
              category: "General",
              description: "Legacy worker profile",
            } as Position,
            positionTitle: "Worker",
            category: "General",
            workerStatus: (data.profile.workerStatus ||
              "applied") as JobApplication["workerStatus"],
            applicationStatus: (data.profile.status ||
              "pending") as JobApplication["applicationStatus"],
            attemptCount: 0,
            maxAttempts: 3,
            totalEarnings: data.profile.totalEarnings || 0,
            pendingEarnings: data.profile.pendingEarnings || 0,
            payRate: data.profile.payRate || 0,
            screening: undefined,
            trainingMaterials: [],
            assignedProjects: [],
            completedProjects: [],
            screeningsCompleted: data.profile.screeningsCompleted || [],
            createdAt: data.profile.createdAt,
          } as JobApplication,
        ]
      : [];

  const normalizedStats = {
    ...stats,
    jobsApplied: stats.jobsApplied ?? 1,
    screeningsCompleted: stats.screeningsCompleted ?? 0,
  };

  return (
    <div className="u-container max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Workspace</h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">Work & Earn</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-400">
            ${normalizedStats.totalEarnings.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400">Total Earnings</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-400">
            ${normalizedStats.pendingEarnings.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400">Pending</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-400">
            {normalizedStats.projectsCompleted}
          </p>
          <p className="text-xs text-slate-400">Projects Done</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-purple-400">
            {normalizedStats.jobsApplied}
          </p>
          <p className="text-xs text-slate-400">Jobs Applied</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex gap-3 flex-wrap">
        <Link href="/apply-to-work" className="btn-primary">
          + Apply to New Position
        </Link>
        <Link href="/wallet" className="btn-secondary">
          💰 Wallet
        </Link>
      </div>

      {/* Job Applications */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Job Roles</h2>
        {normalizedApplications.length === 0 ? (
          <div className="card text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-lg font-medium">No Active Applications</p>
            <p className="text-slate-400 mt-2">
              Apply to a job role to start your journey.
            </p>
          </div>
        ) : (
          normalizedApplications.map((app) => (
            <JobCard key={app._id} app={app} />
          ))
        )}
      </div>
    </div>
  );
}
