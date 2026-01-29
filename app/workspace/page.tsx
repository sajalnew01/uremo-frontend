"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";
// PATCH_39: Status label normalization
import { getStatusLabel } from "@/lib/statusLabels";

/**
 * PATCH_38/39: Enhanced Workspace Page
 * Shows worker status flow: Fresh → Screening Available → Ready To Work → Assigned → Earning
 */

type WorkerProfile = {
  _id: string;
  category: string;
  positionTitle: string;
  workerStatus:
    | "fresh"
    | "screening_available"
    | "ready_to_work"
    | "assigned"
    | "inactive";
  status: "pending" | "approved" | "rejected";
  totalEarnings: number;
  pendingEarnings: number;
  payRate: number;
  screeningsCompleted: any[];
  testsCompleted: any[];
  createdAt: string;
};

type Screening = {
  _id: string;
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  completed?: boolean;
  completedAt?: string;
};

type Project = {
  _id: string;
  title: string;
  description: string;
  payRate: number;
  payType: string;
  deadline?: string;
  status: string;
};

type WorkspaceData = {
  hasProfile: boolean;
  profile?: WorkerProfile;
  availableScreenings: Screening[];
  assignedProjects: Project[];
  completedProjects: Project[];
  stats: {
    totalEarnings: number;
    pendingEarnings: number;
    projectsCompleted: number;
    screeningsCompleted: number;
  };
  message?: string;
};

const STATUS_CONFIG = {
  fresh: {
    label: "Fresh",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    icon: "🌱",
    description: "Complete screenings to unlock work opportunities",
  },
  screening_available: {
    label: "Screening Available",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: "📋",
    description: "You have screenings to complete",
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
  inactive: {
    label: "Inactive",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
    icon: "⏸️",
    description: "Your account is currently inactive",
  },
};

export default function WorkspacePage() {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "screenings" | "projects" | "earnings"
  >("overview");

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
        setError(e?.message || "Failed to load workspace");
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

  const profile = data.profile!;
  const statusConfig =
    STATUS_CONFIG[profile.workerStatus] || STATUS_CONFIG.fresh;

  return (
    <div className="u-container max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Workspace</h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">Work & Earn</p>
      </div>

      {/* Status Card */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${statusConfig.color}`}
            >
              {statusConfig.icon}
            </div>
            <div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}
              >
                {statusConfig.label}
              </div>
              <p className="mt-2 text-sm text-[#9CA3AF]">
                {statusConfig.description}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Category: {profile.category} • Since{" "}
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                ${data.stats.totalEarnings.toFixed(2)}
              </p>
              <p className="text-xs text-[#9CA3AF]">Total Earnings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">
                ${data.stats.pendingEarnings.toFixed(2)}
              </p>
              <p className="text-xs text-[#9CA3AF]">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {data.stats.projectsCompleted}
              </p>
              <p className="text-xs text-[#9CA3AF]">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "overview", label: "Overview", icon: "📊" },
          { id: "screenings", label: "Screenings", icon: "📋" },
          { id: "projects", label: "My Projects", icon: "💼" },
          { id: "earnings", label: "Earnings", icon: "💰" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white/10 text-white border border-white/20"
                : "text-[#9CA3AF] hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Your Progress</h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                "fresh",
                "screening_available",
                "ready_to_work",
                "assigned",
              ].map((step, idx) => {
                const stepConfig =
                  STATUS_CONFIG[step as keyof typeof STATUS_CONFIG];
                const currentIdx = [
                  "fresh",
                  "screening_available",
                  "ready_to_work",
                  "assigned",
                ].indexOf(profile.workerStatus);
                const isCompleted = idx < currentIdx;
                const isCurrent = step === profile.workerStatus;

                return (
                  <div key={step} className="flex items-center gap-2">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-400"
                          : isCurrent
                            ? stepConfig.color
                            : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {isCompleted ? "✓" : stepConfig.icon}
                    </div>
                    <span
                      className={`text-sm whitespace-nowrap ${isCurrent ? "text-white font-medium" : "text-[#9CA3AF]"}`}
                    >
                      {stepConfig.label}
                    </span>
                    {idx < 3 && (
                      <div
                        className={`w-8 h-0.5 ${isCompleted ? "bg-emerald-500" : "bg-slate-700"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Steps */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
            {profile.workerStatus === "fresh" && (
              <div className="space-y-3">
                <p className="text-[#9CA3AF]">
                  Complete your first screening to advance:
                </p>
                {data.availableScreenings.slice(0, 3).map((s) => (
                  <Link
                    key={s._id}
                    href={`/workspace/screening/${s._id}`}
                    className="block p-4 rounded-xl border border-white/10 hover:border-amber-500/30 hover:bg-amber-500/5 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{s.title}</p>
                        <p className="text-sm text-[#9CA3AF]">
                          {s.timeLimit} min • {s.passingScore}% to pass
                        </p>
                      </div>
                      <span className="text-amber-400">Start →</span>
                    </div>
                  </Link>
                ))}
                {data.availableScreenings.length === 0 && (
                  <p className="text-slate-500 text-center py-4">
                    No screenings available yet. Check back soon!
                  </p>
                )}
              </div>
            )}
            {profile.workerStatus === "screening_available" && (
              <div className="space-y-3">
                <p className="text-[#9CA3AF]">
                  Complete more screenings to become Ready To Work:
                </p>
                {data.availableScreenings.slice(0, 3).map((s) => (
                  <Link
                    key={s._id}
                    href={`/workspace/screening/${s._id}`}
                    className="block p-4 rounded-xl border border-white/10 hover:border-amber-500/30 hover:bg-amber-500/5 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{s.title}</p>
                        <p className="text-sm text-[#9CA3AF]">
                          {s.timeLimit} min • {s.passingScore}% to pass
                        </p>
                      </div>
                      <span className="text-amber-400">Start →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {profile.workerStatus === "ready_to_work" && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-lg font-medium">Waiting for Assignment</p>
                <p className="text-[#9CA3AF] mt-2">
                  You're approved and ready! An admin will assign you a project
                  soon.
                </p>
              </div>
            )}
            {profile.workerStatus === "assigned" &&
              data.assignedProjects.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[#9CA3AF]">Your active projects:</p>
                  {data.assignedProjects.map((p) => (
                    <Link
                      key={p._id}
                      href={`/workspace/project/${p._id}`}
                      className="block p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{p.title}</p>
                          <p className="text-sm text-[#9CA3AF]">
                            ${p.payRate} / {p.payType}
                          </p>
                        </div>
                        <span className="text-blue-400">View →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}

      {activeTab === "screenings" && (
        <div className="space-y-4">
          {data.availableScreenings.length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-lg font-medium">No Screenings Available</p>
              <p className="text-[#9CA3AF] mt-2">
                Check back later for new screening opportunities.
              </p>
            </div>
          ) : (
            data.availableScreenings.map((s) => (
              <div key={s._id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{s.title}</h4>
                    <p className="text-sm text-[#9CA3AF] mt-1">
                      {s.description}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-slate-400">
                      <span>⏱️ {s.timeLimit} minutes</span>
                      <span>🎯 {s.passingScore}% to pass</span>
                    </div>
                  </div>
                  {s.completed ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm">
                      ✓ Completed
                    </span>
                  ) : (
                    <Link
                      href={`/workspace/screening/${s._id}`}
                      className="btn-primary"
                    >
                      Start
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "projects" && (
        <div className="space-y-4">
          {data.assignedProjects.length === 0 &&
          data.completedProjects.length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-4xl mb-4">💼</div>
              <p className="text-lg font-medium">No Projects Yet</p>
              <p className="text-[#9CA3AF] mt-2">
                Complete screenings and get approved to receive project
                assignments.
              </p>
            </div>
          ) : (
            <>
              {data.assignedProjects.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Active Projects
                  </h3>
                  {data.assignedProjects.map((p) => (
                    <Link
                      key={p._id}
                      href={`/workspace/project/${p._id}`}
                      className="block card mb-3 hover:border-blue-500/30 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{p.title}</h4>
                          <p className="text-sm text-[#9CA3AF]">
                            ${p.payRate} / {p.payType}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm">
                          {p.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {data.completedProjects.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Completed Projects
                  </h3>
                  {data.completedProjects.map((p: any) => (
                    <div key={p._id} className="card mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{p.title}</h4>
                          <p className="text-sm text-emerald-400">
                            +${p.earningsCredited?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm">
                          ✓ Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "earnings" && (
        <div className="space-y-6">
          {/* Earnings Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-emerald-400">
                ${data.stats.totalEarnings.toFixed(2)}
              </p>
              <p className="text-sm text-[#9CA3AF] mt-1">Total Earned</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-amber-400">
                ${data.stats.pendingEarnings.toFixed(2)}
              </p>
              <p className="text-sm text-[#9CA3AF] mt-1">Pending Approval</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-blue-400">
                ${profile.payRate.toFixed(2)}
              </p>
              <p className="text-sm text-[#9CA3AF] mt-1">Your Pay Rate</p>
            </div>
          </div>

          {/* Withdraw Button */}
          {data.stats.totalEarnings > 0 && (
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Ready to Withdraw</h3>
                  <p className="text-sm text-[#9CA3AF]">
                    Transfer earnings to your wallet
                  </p>
                </div>
                <Link href="/workspace/withdraw" className="btn-primary">
                  Withdraw ${data.stats.totalEarnings.toFixed(2)}
                </Link>
              </div>
            </div>
          )}

          {/* Earnings History */}
          <div className="card">
            <h3 className="font-semibold mb-4">Earnings History</h3>
            {data.completedProjects.length === 0 ? (
              <p className="text-[#9CA3AF] text-center py-4">No earnings yet</p>
            ) : (
              <div className="space-y-3">
                {data.completedProjects.map((p: any) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-[#9CA3AF]">
                        {new Date(p.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-emerald-400 font-medium">
                      +${p.earningsCredited?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
