"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/useToast";

/**
 * PATCH_43: Worker Journey Engine - Enhanced Workspace Page
 * Multi-job support with independent status per job role
 * States: Applied → Screening Unlocked → Test Submitted → Ready To Work → Assigned → Working
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

// PATCH_43: Authoritative status configuration
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: string; description: string }
> = {
  applied: {
    label: "Applied",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    icon: "📝",
    description: "Waiting for admin review",
  },
  screening_unlocked: {
    label: "Screening Unlocked",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: "🔓",
    description: "Complete the screening test to proceed",
  },
  test_submitted: {
    label: "Test Submitted",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: "📤",
    description: "Awaiting grading",
  },
  failed: {
    label: "Failed",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: "❌",
    description: "Contact admin for re-evaluation",
  },
  ready_to_work: {
    label: "Ready To Work",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: "✅",
    description: "Waiting for project assignment",
  },
  assigned: {
    label: "Assigned",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: "💼",
    description: "You have an active project",
  },
  working: {
    label: "Working",
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    icon: "⚡",
    description: "Project in progress",
  },
  suspended: {
    label: "Suspended",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: "⏸️",
    description: "Account suspended by admin",
  },
  // Legacy fallbacks
  fresh: {
    label: "Applied",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    icon: "📝",
    description: "Waiting for admin review",
  },
  screening_available: {
    label: "Screening Unlocked",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: "🔓",
    description: "Complete the screening test to proceed",
  },
  inactive: {
    label: "Suspended",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: "⏸️",
    description: "Account suspended",
  },
};

// PATCH_43: Journey steps for progress tracker
const JOURNEY_STEPS = [
  "applied",
  "screening_unlocked",
  "ready_to_work",
  "assigned",
  "working",
];

function JobCard({ app }: { app: JobApplication }) {
  const status = STATUS_CONFIG[app.workerStatus] || STATUS_CONFIG.applied;
  const currentStepIdx = JOURNEY_STEPS.indexOf(app.workerStatus);

  return (
    <div className="card">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${status.color}`}
          >
            {status.icon}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{app.positionTitle}</h3>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${status.color} mt-1`}
            >
              {status.label}
            </div>
            <p className="text-xs text-slate-400 mt-1">{status.description}</p>
          </div>
        </div>

        <div className="flex gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-emerald-400">
              ${app.totalEarnings.toFixed(2)}
            </p>
            <p className="text-xs text-slate-400">Earned</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-400">
              ${app.pendingEarnings.toFixed(2)}
            </p>
            <p className="text-xs text-slate-400">Pending</p>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="mb-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {JOURNEY_STEPS.map((step, idx) => {
            const stepConfig = STATUS_CONFIG[step];
            const isCompleted = idx < currentStepIdx;
            const isCurrent = step === app.workerStatus;
            const isFailed = app.workerStatus === "failed" && idx === 1;

            return (
              <div key={step} className="flex items-center">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    isCompleted
                      ? "bg-emerald-500/20 text-emerald-400"
                      : isCurrent
                        ? stepConfig.color
                        : isFailed
                          ? "bg-red-500/20 text-red-400"
                          : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {isCompleted ? "✓" : stepConfig.icon}
                </div>
                {idx < JOURNEY_STEPS.length - 1 && (
                  <div
                    className={`w-6 h-0.5 mx-1 ${
                      isCompleted ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Area */}
      <div className="border-t border-white/10 pt-4">
        {/* Applied - Waiting for approval */}
        {app.workerStatus === "applied" && (
          <div className="text-center text-slate-400">
            <p className="text-sm">
              Your application is under review. An admin will review it soon.
            </p>
            {app.applicationStatus === "rejected" && (
              <p className="text-red-400 mt-2">
                Application was rejected. Check with admin for details.
              </p>
            )}
          </div>
        )}

        {/* Screening Unlocked - Show training materials and take test */}
        {app.workerStatus === "screening_unlocked" && (
          <div className="space-y-4">
            {/* Training Materials */}
            {app.trainingMaterials && app.trainingMaterials.length > 0 && (
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                <h4 className="font-medium text-amber-300 mb-2">
                  📚 Training Materials
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Review these before taking the test
                </p>
                <div className="space-y-2">
                  {app.trainingMaterials.map((m, i) => (
                    <a
                      key={i}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-amber-200 hover:text-amber-100"
                    >
                      {m.type === "video" && "🎥"}
                      {m.type === "pdf" && "📄"}
                      {m.type === "link" && "🔗"}
                      {m.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Take Test Button */}
            {app.screening && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-slate-400">
                  Attempts: {app.attemptCount} / {app.maxAttempts}
                </p>
                <Link
                  href={`/workspace/screening/${app.screening._id}?position=${app._id}`}
                  className="btn-primary"
                >
                  {app.attemptCount > 0 ? "Retry Test" : "Start Test"}
                </Link>
                <p className="text-xs text-slate-500">
                  Time limit: {app.screening.timeLimit} min • Pass:{" "}
                  {app.screening.passingScore}%
                </p>
              </div>
            )}
          </div>
        )}

        {/* Failed - Show retry option or contact admin */}
        {app.workerStatus === "failed" && (
          <div className="text-center space-y-2">
            <p className="text-red-400">
              You&apos;ve used all {app.maxAttempts} attempts.
            </p>
            <p className="text-sm text-slate-400">
              Contact admin to reset your attempts and try again.
            </p>
            <Link href="/support" className="btn-secondary inline-block mt-2">
              Contact Support
            </Link>
          </div>
        )}

        {/* Ready To Work - Waiting for assignment */}
        {app.workerStatus === "ready_to_work" && (
          <div className="text-center">
            <div className="text-4xl mb-2">⏳</div>
            <p className="font-medium">Waiting for Project Assignment</p>
            <p className="text-sm text-slate-400 mt-1">
              You&apos;re approved! An admin will assign you a project soon.
            </p>
          </div>
        )}

        {/* Assigned / Working - Show current project */}
        {(app.workerStatus === "assigned" || app.workerStatus === "working") &&
          app.assignedProjects.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Active Projects</h4>
              {app.assignedProjects.map((p) => (
                <Link
                  key={p._id}
                  href={`/workspace/project/${p._id}`}
                  className="block p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-sm text-slate-400">
                        ${p.payRate} / {p.payType}
                      </p>
                    </div>
                    <span className="text-blue-400">View →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

        {/* Suspended */}
        {app.workerStatus === "suspended" && (
          <div className="text-center text-red-400">
            <p>Your account has been suspended.</p>
            <p className="text-sm text-slate-400 mt-1">
              Contact support for assistance.
            </p>
          </div>
        )}

        {/* Completed Projects */}
        {app.completedProjects.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-slate-400 mb-2">
              Completed: {app.completedProjects.length} projects
            </p>
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
    return (
      <div className="u-container max-w-6xl">
        <div className="card">
          <p className="text-red-300">{error}</p>
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
