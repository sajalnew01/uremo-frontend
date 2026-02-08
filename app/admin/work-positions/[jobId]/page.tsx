"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

/**
 * PATCH_43: Admin Job Role Control Panel
 * PATCH_46: Enhanced UX with Screening Editor, Projects Tab, and Human-Friendly Actions
 * Manage applicants, screenings, training materials, and worker assignments
 */

type ScreeningOption = {
  _id: string;
  title: string;
  passingScore: number;
  timeLimit: number;
};

type Project = {
  _id?: string;
  title: string;
  description?: string;
  instructions?: string;
  payRate: number;
  payType: "per_task" | "hourly" | "fixed";
  deadline?: string;
  status: "draft" | "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  assignedWorker?: string;
  screeningId?: { _id: string; title: string; passingScore: number } | string | null;
  screeningIds?: Array<{ _id: string; title: string; passingScore: number } | string>;
  workPositionId?: string;
};

type TrainingMaterial = {
  title: string;
  type: "link" | "pdf" | "video";
  url: string;
  description?: string;
};

type JobRole = {
  _id: string;
  title: string;
  category: string;
  description?: string;
  hasScreening?: boolean;
  screeningId?: {
    _id: string;
    title: string;
    passingScore: number;
    timeLimit: number;
  };
  trainingMaterials?: TrainingMaterial[];
  serviceId?: { _id: string; title: string; category: string };
  active: boolean;
};

type Applicant = {
  _id: string;
  user: { _id: string; name: string; email: string };
  workerStatus: string;
  applicationStatus: string;
  attemptCount: number;
  maxAttempts: number;
  totalEarnings: number;
  payRate: number;
  createdAt: string;
};

type JobStats = {
  totalApplicants: number;
  applied: number;
  screeningUnlocked: number;
  testSubmitted: number;
  failed: number;
  readyToWork: number;
  assigned: number;
  working: number;
  suspended: number;
};

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-slate-500/20 text-slate-300",
  screening_unlocked: "bg-amber-500/20 text-amber-300",
  training_viewed: "bg-blue-500/20 text-blue-300",
  test_submitted: "bg-purple-500/20 text-purple-300",
  failed: "bg-red-500/20 text-red-300",
  ready_to_work: "bg-emerald-500/20 text-emerald-300",
  assigned: "bg-blue-500/20 text-blue-300",
  working: "bg-cyan-500/20 text-cyan-300",
  suspended: "bg-red-500/20 text-red-300",
  completed: "bg-green-500/20 text-green-300",
};

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  screening_unlocked: "Screening Unlocked",
  training_viewed: "Training Viewed",
  test_submitted: "Test Submitted",
  failed: "Failed",
  ready_to_work: "Ready To Work",
  assigned: "Assigned",
  working: "Working",
  suspended: "Suspended",
  completed: "Completed",
};

// PATCH_61: Lifecycle tabs for worker journey
type LifecycleTab =
  | "applicants"
  | "screening"
  | "ready"
  | "active"
  | "completed"
  | "settings";

// Helper to get worker display name
const getWorkerName = (user: any): string => {
  if (!user) return "Unknown User";
  if (user.firstName && user.lastName)
    return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.name) return user.name;
  if (user.email) return user.email.split("@")[0];
  return "Unknown User";
};

export default function AdminJobRolePage() {
  const params = useParams();
  const { toast } = useToast();
  const jobId = params?.jobId as string;

  const [job, setJob] = useState<JobRole | null>(null);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LifecycleTab>("applicants");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  // Training materials form
  const [trainingForm, setTrainingForm] = useState<TrainingMaterial[]>([]);

  // PATCH_52A: Centralized screening selection
  const [screenings, setScreenings] = useState<ScreeningOption[]>([]);
  const [selectedScreeningId, setSelectedScreeningId] = useState<string>("");

  // PATCH_46: Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLockedReason, setProjectsLockedReason] = useState<
    string | null
  >(null);
  const [projectForm, setProjectForm] = useState<Project>({
    title: "",
    description: "",
    payRate: 0,
    payType: "per_task",
    status: "draft",
  });
  const [projectMode, setProjectMode] = useState<"list" | "create" | "edit">("list");
  // PATCH_88: Edit project state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectScreeningIds, setEditProjectScreeningIds] = useState<string[]>([]);

  const loadJob = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await apiRequest(
        `/api/admin/workspace/job/${jobId}`,
        "GET",
        null,
        true,
      );
      setJob(res.job);
      setStats(res.stats);
      setTrainingForm(res.job.trainingMaterials || []);
      setSelectedScreeningId(res.job.screeningId?._id || "");
    } catch (e: any) {
      toast(e?.message || "Failed to load job role", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async (status?: string) => {
    if (!jobId) return;
    try {
      const url =
        status && status !== "all"
          ? `/api/admin/workspace/job/${jobId}/applicants?workerStatus=${status}`
          : `/api/admin/workspace/job/${jobId}/applicants`;
      const res = await apiRequest(url, "GET", null, true);
      setApplicants(res.applicants || []);
    } catch (e: any) {
      console.error("Failed to load applicants:", e);
    }
  };

  const loadScreenings = async () => {
    try {
      const res = await apiRequest(
        "/api/admin/workspace/screenings",
        "GET",
        null,
        true,
      );
      setScreenings(res.screenings || []);
    } catch (e: any) {
      console.error("Failed to load screenings:", e);
    }
  };

  useEffect(() => {
    loadJob();
    loadApplicants();
    loadProjects();
    loadScreenings();
  }, [jobId]);

  useEffect(() => {
    loadApplicants(statusFilter);
  }, [statusFilter]);

  // Admin actions
  const approveApplicant = async (applicantId: string) => {
    setSaving(true);
    try {
      await apiRequest(
        `/api/admin/workspace/job/${jobId}/approve`,
        "PUT",
        { applicantId },
        true,
      );
      toast("Applicant approved", "success");
      loadApplicants(statusFilter);
      loadJob();
    } catch (e: any) {
      toast(e?.message || "Failed to approve", "error");
    } finally {
      setSaving(false);
    }
  };

  const rejectApplicant = async (applicantId: string) => {
    setSaving(true);
    try {
      await apiRequest(
        `/api/admin/workspace/job/${jobId}/reject`,
        "PUT",
        { applicantId },
        true,
      );
      toast("Applicant rejected", "success");
      loadApplicants(statusFilter);
      loadJob();
    } catch (e: any) {
      toast(e?.message || "Failed to reject", "error");
    } finally {
      setSaving(false);
    }
  };

  const unlockScreening = async (applicantId: string) => {
    setSaving(true);
    try {
      await apiRequest(
        `/api/admin/workspace/job/${jobId}/unlock-screening`,
        "PUT",
        { applicantId },
        true,
      );
      toast("Screening unlocked", "success");
      loadApplicants(statusFilter);
      loadJob();
    } catch (e: any) {
      toast(e?.message || "Failed to unlock screening", "error");
    } finally {
      setSaving(false);
    }
  };

  const setWorkerStatus = async (
    applicantId: string,
    workerStatus: string,
    resetAttempts?: boolean,
  ) => {
    setSaving(true);
    try {
      await apiRequest(
        `/api/admin/workspace/job/${jobId}/set-status`,
        "PUT",
        {
          applicantId,
          workerStatus,
          resetAttempts,
        },
        true,
      );
      toast(`Status set to ${STATUS_LABELS[workerStatus]}`, "success");
      loadApplicants(statusFilter);
      loadJob();
    } catch (e: any) {
      toast(e?.message || "Failed to update status", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveTrainingMaterials = async () => {
    setSaving(true);
    try {
      await apiRequest(
        `/api/admin/workspace/job/${jobId}/set-training`,
        "PUT",
        {
          trainingMaterials: trainingForm,
        },
        true,
      );
      toast("Training materials saved", "success");
      loadJob();
    } catch (e: any) {
      toast(e?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const addTrainingMaterial = () => {
    setTrainingForm([...trainingForm, { title: "", type: "link", url: "" }]);
  };

  const removeTrainingMaterial = (idx: number) => {
    setTrainingForm(trainingForm.filter((_, i) => i !== idx));
  };

  const updateTrainingMaterial = (
    idx: number,
    field: keyof TrainingMaterial,
    value: string,
  ) => {
    const updated = [...trainingForm];
    (updated[idx] as any)[field] = value;
    setTrainingForm(updated);
  };

  // PATCH_52A: Screening selection functions
  const saveScreeningSelection = async () => {
    setSaving(true);
    try {
      await apiRequest(
        `/api/admin/workspace/job/${jobId}/set-screening`,
        "PUT",
        { screeningId: selectedScreeningId || null },
        true,
      );
      toast("Screening updated", "success");
      loadJob();
    } catch (e: any) {
      toast(e?.message || "Failed to update screening", "error");
    } finally {
      setSaving(false);
    }
  };

  // PATCH_46: Project Functions
  const loadProjects = async () => {
    try {
      const res = await apiRequest(
        `/api/admin/workspace/job/${jobId}/projects`,
        "GET",
        null,
        true,
      );
      setProjects(res.projects || []);
      setProjectsLockedReason(null);
    } catch (e: any) {
      setProjects([]);
      setProjectsLockedReason(
        "LOCKED: Projects are unavailable for this job role in the deployed backend (or you lack access). Required to unlock: backend must support /api/admin/workspace/job/:jobId/projects and your admin token must have permission.",
      );
    }
  };

  const createProject = async () => {
    if (projectsLockedReason) {
      toast(projectsLockedReason, "error");
      return;
    }
    if (!projectForm.title) {
      toast("Please add a project title", "error");
      return;
    }
    setSaving(true);
    try {
      await apiRequest(
        `/api/admin/workspace/job/${jobId}/projects`,
        "POST",
        projectForm,
        true,
      );
      toast("Project created", "success");
      setProjectMode("list");
      setProjectForm({
        title: "",
        description: "",
        payRate: 0,
        payType: "per_task",
        status: "draft",
      });
      loadProjects();
    } catch (e: any) {
      toast(e?.message || "Failed to create project", "error");
    } finally {
      setSaving(false);
    }
  };

  const assignProject = async (projectId: string, workerId: string) => {
    if (projectsLockedReason) {
      toast(projectsLockedReason, "error");
      return;
    }
    setSaving(true);
    try {
      await apiRequest(
        `/api/admin/workspace/project/${projectId}/assign`,
        "PUT",
        { workerId },
        true,
      );
      toast("Project assigned", "success");
      loadProjects();
    } catch (e: any) {
      toast(e?.message || "Failed to assign", "error");
    } finally {
      setSaving(false);
    }
  };

  // PATCH_88: Edit project with screening management
  const startEditProject = (proj: Project) => {
    setEditingProject(proj);
    // Extract screening IDs from populated or string references
    const ids: string[] = [];
    if (proj.screeningIds && Array.isArray(proj.screeningIds)) {
      proj.screeningIds.forEach((s: any) => {
        ids.push(typeof s === "string" ? s : s._id);
      });
    }
    if (proj.screeningId && ids.length === 0) {
      const sid = typeof proj.screeningId === "string" ? proj.screeningId : proj.screeningId._id;
      if (sid) ids.push(sid);
    }
    setEditProjectScreeningIds(ids);
    setProjectMode("edit");
  };

  const saveEditProject = async () => {
    if (!editingProject?._id) return;
    setSaving(true);
    try {
      await apiRequest(
        `/api/admin/workspace/project/${editingProject._id}`,
        "PUT",
        {
          title: editingProject.title,
          description: editingProject.description,
          instructions: editingProject.instructions,
          payRate: editingProject.payRate,
          payType: editingProject.payType,
          deadline: editingProject.deadline,
          screeningIds: editProjectScreeningIds,
          screeningId: editProjectScreeningIds[0] || null,
        },
        true,
      );
      toast("Project updated", "success");
      setProjectMode("list");
      setEditingProject(null);
      loadProjects();
    } catch (e: any) {
      toast(e?.message || "Failed to update project", "error");
    } finally {
      setSaving(false);
    }
  };

  const activateProject = async (projectId: string) => {
    setSaving(true);
    try {
      await apiRequest(
        `/api/admin/workspace/job/${jobId}/projects/${projectId}/activate`,
        "PUT",
        {},
        true,
      );
      toast("Project activated", "success");
      loadProjects();
    } catch (e: any) {
      toast(e?.message || "Failed to activate project", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleScreeningId = (id: string) => {
    setEditProjectScreeningIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const selectedScreening =
    screenings.find((s) => s._id === selectedScreeningId) ||
    job?.screeningId ||
    null;

  if (loading) {
    return (
      <div className="u-container max-w-6xl">
        <div className="card animate-pulse">
          <div className="h-20 rounded-xl bg-white/10" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="u-container max-w-6xl">
        <div className="card text-center py-8">
          <p className="text-red-400">Job role not found</p>
          <Link
            href="/admin/work-positions"
            className="btn-secondary mt-4 inline-block"
          >
            Back to Work Positions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="u-container max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/work-positions"
          className="text-sm text-slate-400 hover:text-white mb-2 inline-block"
        >
          ← Back to Work Positions
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-sm text-slate-400 mt-1">
              Category: {job.category}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm ${job.active ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-300"}`}
          >
            {job.active ? "Active" : "Inactive"}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-bold">{stats.totalApplicants}</p>
            <p className="text-xs text-slate-400">Total Applicants</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-amber-400">
              {stats.applied + stats.screeningUnlocked}
            </p>
            <p className="text-xs text-slate-400">In Progress</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {stats.readyToWork}
            </p>
            <p className="text-xs text-slate-400">Ready To Work</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-400">
              {stats.assigned + stats.working}
            </p>
            <p className="text-xs text-slate-400">Active Workers</p>
          </div>
        </div>
      )}

      {/* PATCH_63: Contextual Guidance Banner for Job Role */}
      {stats && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-800/50 to-emerald-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-1">
                Job Role Status:
              </h3>
              <p className="text-sm text-slate-300">
                {stats.applied > 0 && (
                  <span className="block">
                    →{" "}
                    <span className="text-amber-400">
                      {stats.applied} application{stats.applied > 1 ? "s" : ""}
                    </span>{" "}
                    waiting in <span className="font-medium">Applicants</span>{" "}
                    tab for your review
                  </span>
                )}
                {stats.testSubmitted > 0 && (
                  <span className="block">
                    →{" "}
                    <span className="text-purple-400">
                      {stats.testSubmitted} test
                      {stats.testSubmitted > 1 ? "s" : ""}
                    </span>{" "}
                    ready to grade in{" "}
                    <span className="font-medium">Screening</span> tab
                  </span>
                )}
                {stats.readyToWork > 0 && (
                  <span className="block">
                    →{" "}
                    <span className="text-emerald-400">
                      {stats.readyToWork} worker
                      {stats.readyToWork > 1 ? "s" : ""}
                    </span>{" "}
                    passed screening — assign projects in{" "}
                    <span className="font-medium">Ready to Work</span> tab
                  </span>
                )}
                {stats.assigned + stats.working > 0 && (
                  <span className="block">
                    →{" "}
                    <span className="text-cyan-400">
                      {stats.assigned + stats.working} worker
                      {stats.assigned + stats.working > 1 ? "s" : ""}
                    </span>{" "}
                    actively working — monitor in{" "}
                    <span className="font-medium">Active</span> tab
                  </span>
                )}
                {stats.applied === 0 &&
                  stats.testSubmitted === 0 &&
                  stats.readyToWork === 0 &&
                  stats.assigned + stats.working === 0 && (
                    <span className="text-slate-400">
                      No pending actions for this job role. Workers will appear
                      when they apply.
                    </span>
                  )}
              </p>
            </div>
            <Link
              href="/admin/workforce"
              className="text-xs text-slate-400 hover:text-white whitespace-nowrap"
            >
              → All Workers
            </Link>
          </div>
        </div>
      )}

      {/* PATCH_61: Lifecycle-Based Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          {
            id: "applicants",
            label: "Applicants",
            icon: "📝",
            count: stats?.applied || 0,
          },
          {
            id: "screening",
            label: "Screening",
            icon: "📋",
            count:
              (stats?.screeningUnlocked || 0) + (stats?.testSubmitted || 0),
          },
          {
            id: "ready",
            label: "Ready to Work",
            icon: "✅",
            count: stats?.readyToWork || 0,
          },
          {
            id: "active",
            label: "Active",
            icon: "⚡",
            count: (stats?.assigned || 0) + (stats?.working || 0),
          },
          { id: "completed", label: "Completed", icon: "🏆", count: 0 },
          { id: "settings", label: "Settings", icon: "⚙️", count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as LifecycleTab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-white/10 text-white border border-white/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applicants Tab - PATCH_61: Enhanced with Worker 360 links */}
      {activeTab === "applicants" && (
        <div className="space-y-4">
          {/* Filter for pending applications */}
          <div className="flex gap-2 flex-wrap items-center justify-between">
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="applied">Pending Review</option>
              </select>
            </div>
            <p className="text-sm text-slate-400">
              {applicants.filter((a) => a.workerStatus === "applied").length}{" "}
              pending approval
            </p>
          </div>

          {/* Applicant List */}
          {applicants.filter(
            (a) => a.workerStatus === "applied" || statusFilter === "all",
          ).length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-slate-400">No pending applicants</p>
              <p className="text-sm text-slate-500 mt-1">
                New applications will appear here
              </p>
            </div>
          ) : (
            applicants
              .filter(
                (a) => statusFilter === "all" || a.workerStatus === "applied",
              )
              .map((app) => (
                <div
                  key={app._id}
                  className="card hover:border-white/20 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Worker Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {getWorkerName(app.user).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          href={`/admin/workforce/${app._id}`}
                          className="font-semibold hover:text-cyan-400 transition-colors"
                        >
                          {getWorkerName(app.user)}
                        </Link>
                        <p className="text-sm text-slate-400">
                          {app.user?.email || "No email"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[app.workerStatus] || "bg-slate-500/20 text-slate-300"}`}
                          >
                            {STATUS_LABELS[app.workerStatus] ||
                              app.workerStatus}
                          </span>
                          <span className="text-xs text-slate-500">
                            Applied{" "}
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {app.workerStatus === "applied" &&
                        app.applicationStatus === "pending" && (
                          <>
                            <button
                              onClick={() => approveApplicant(app._id)}
                              disabled={saving}
                              className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30 disabled:opacity-50 font-medium"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => rejectApplicant(app._id)}
                              disabled={saving}
                              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      {app.workerStatus === "applied" &&
                        app.applicationStatus === "approved" && (
                          <button
                            onClick={() => unlockScreening(app._id)}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 text-sm hover:bg-amber-500/30 disabled:opacity-50 font-medium"
                          >
                            🔓 Unlock Screening
                          </button>
                        )}
                      <Link
                        href={`/admin/workforce/${app._id}`}
                        className="px-3 py-2 rounded-lg bg-white/5 text-slate-300 text-sm hover:bg-white/10"
                      >
                        View Profile →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* PATCH_61: Screening Tab - Workers in screening phase */}
      {activeTab === "screening" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">📋 Workers in Screening</h3>
              <p className="text-sm text-slate-400 mt-1">
                Workers who are taking or have submitted their screening test
              </p>
            </div>
            <Link
              href="/admin/workspace/screenings"
              className="text-sm text-cyan-400 hover:underline"
            >
              Manage Screenings →
            </Link>
          </div>

          {/* Current Screening Info */}
          {selectedScreening ? (
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedScreening.title}</p>
                  <div className="flex gap-4 mt-1 text-sm text-slate-400">
                    <span>Pass: {selectedScreening.passingScore}%</span>
                    <span>Time: {selectedScreening.timeLimit} min</span>
                  </div>
                </div>
                <Link
                  href={`/admin/workspace/screenings/${selectedScreeningId}`}
                  className="btn-secondary text-sm"
                >
                  Edit Test
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <p className="text-amber-300">
                ⚠️ No screening test assigned to this job role
              </p>
              <Link
                href="/admin/workspace/screenings"
                className="text-sm text-amber-400 hover:underline mt-1 inline-block"
              >
                Assign a screening in Settings →
              </Link>
            </div>
          )}

          {/* Workers in Screening */}
          {applicants.filter(
            (a) =>
              a.workerStatus === "screening_unlocked" ||
              a.workerStatus === "test_submitted" ||
              a.workerStatus === "training_viewed" ||
              a.workerStatus === "failed",
          ).length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-slate-400">No workers in screening phase</p>
              <p className="text-sm text-slate-500 mt-1">
                Approve applicants to unlock screening
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applicants
                .filter(
                  (a) =>
                    a.workerStatus === "screening_unlocked" ||
                    a.workerStatus === "test_submitted" ||
                    a.workerStatus === "training_viewed" ||
                    a.workerStatus === "failed",
                )
                .map((worker) => (
                  <div
                    key={worker._id}
                    className="card hover:border-white/20 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                          {getWorkerName(worker.user).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/admin/workforce/${worker._id}`}
                            className="font-semibold hover:text-cyan-400 transition-colors"
                          >
                            {getWorkerName(worker.user)}
                          </Link>
                          <p className="text-sm text-slate-400">
                            {worker.user?.email || "No email"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[worker.workerStatus]}`}
                            >
                              {STATUS_LABELS[worker.workerStatus]}
                            </span>
                            <span className="text-xs text-slate-500">
                              Attempts: {worker.attemptCount}/
                              {worker.maxAttempts}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Screening Actions */}
                      <div className="flex flex-wrap gap-2">
                        {worker.workerStatus === "test_submitted" && (
                          <button
                            onClick={() =>
                              setWorkerStatus(worker._id, "ready_to_work")
                            }
                            disabled={saving}
                            className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30 disabled:opacity-50 font-medium"
                          >
                            ✓ Mark Passed
                          </button>
                        )}
                        {worker.workerStatus === "failed" && (
                          <button
                            onClick={() =>
                              setWorkerStatus(
                                worker._id,
                                "screening_unlocked",
                                true,
                              )
                            }
                            disabled={saving}
                            className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 text-sm hover:bg-amber-500/30 disabled:opacity-50"
                          >
                            🔄 Allow Retry
                          </button>
                        )}
                        {/* PATCH_73: Hide 'Skip → Ready' when job has screening - flow must go through test */}
                        {(worker.workerStatus === "screening_unlocked" ||
                          worker.workerStatus === "training_viewed") &&
                          !job?.hasScreening && (
                            <button
                              onClick={() =>
                                setWorkerStatus(worker._id, "ready_to_work")
                              }
                              disabled={saving}
                              className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30 disabled:opacity-50"
                            >
                              Skip → Ready
                            </button>
                          )}
                        <Link
                          href={`/admin/workforce/${worker._id}`}
                          className="px-3 py-2 rounded-lg bg-white/5 text-slate-300 text-sm hover:bg-white/10"
                        >
                          View Profile →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* PATCH_61: Ready to Work Tab */}
      {activeTab === "ready" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">✅ Ready to Work</h3>
              <p className="text-sm text-slate-400 mt-1">
                Workers who passed screening and are ready for project
                assignment
              </p>
            </div>
          </div>

          {applicants.filter((a) => a.workerStatus === "ready_to_work")
            .length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-slate-400">No workers ready for assignment</p>
              <p className="text-sm text-slate-500 mt-1">
                Workers will appear here after passing screening
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {applicants
                .filter((a) => a.workerStatus === "ready_to_work")
                .map((worker) => (
                  <div
                    key={worker._id}
                    className="card hover:border-emerald-500/30 transition-colors bg-gradient-to-br from-emerald-500/5 to-transparent"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-xl">
                        {getWorkerName(worker.user).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/admin/workforce/${worker._id}`}
                          className="font-semibold text-lg hover:text-cyan-400 transition-colors"
                        >
                          {getWorkerName(worker.user)}
                        </Link>
                        <p className="text-sm text-slate-400">
                          {worker.user?.email || "No email"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300">
                            ✓ Screening Passed
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* PATCH_73: Removed 'Mark Assigned (status only)' - assignment must go through project flow */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                      <Link
                        href="/admin/workspace/projects"
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 text-sm hover:bg-blue-500/30 text-center font-medium"
                      >
                        📦 Assign via Projects
                      </Link>
                      <Link
                        href={`/admin/workforce/${worker._id}`}
                        className="px-4 py-2 rounded-lg bg-white/5 text-slate-300 text-sm hover:bg-white/10"
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* PATCH_61: Active Workers Tab */}
      {activeTab === "active" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">⚡ Active Workers</h3>
              <p className="text-sm text-slate-400 mt-1">
                Workers currently assigned to projects or working
              </p>
            </div>
            <Link
              href="/admin/workspace/projects"
              className="text-sm text-cyan-400 hover:underline"
            >
              View All Projects →
            </Link>
          </div>

          {applicants.filter(
            (a) =>
              a.workerStatus === "assigned" || a.workerStatus === "working",
          ).length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-4xl mb-3">⚡</div>
              <p className="text-slate-400">No active workers</p>
              <p className="text-sm text-slate-500 mt-1">
                Assign projects to ready workers to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applicants
                .filter(
                  (a) =>
                    a.workerStatus === "assigned" ||
                    a.workerStatus === "working",
                )
                .map((worker) => (
                  <div
                    key={worker._id}
                    className="card hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                          {getWorkerName(worker.user).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/admin/workforce/${worker._id}`}
                            className="font-semibold hover:text-cyan-400 transition-colors"
                          >
                            {getWorkerName(worker.user)}
                          </Link>
                          <p className="text-sm text-slate-400">
                            {worker.user?.email || "No email"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[worker.workerStatus]}`}
                            >
                              {STATUS_LABELS[worker.workerStatus]}
                            </span>
                            {worker.totalEarnings > 0 && (
                              <span className="text-xs text-emerald-400">
                                💰 ${worker.totalEarnings.toFixed(2)} earned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/admin/proofs"
                          className="px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm hover:bg-purple-500/30"
                        >
                          View Proofs
                        </Link>
                        <Link
                          href={`/admin/workforce/${worker._id}`}
                          className="px-3 py-2 rounded-lg bg-white/5 text-slate-300 text-sm hover:bg-white/10"
                        >
                          View Profile →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* PATCH_61: Completed Tab */}
      {activeTab === "completed" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">🏆 Completed Work</h3>
              <p className="text-sm text-slate-400 mt-1">
                Workers who have completed projects (view in Proofs section)
              </p>
            </div>
          </div>

          <div className="card text-center py-8">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-slate-400">
              View completed work in the Proofs section
            </p>
            <Link
              href="/admin/proofs"
              className="btn-primary mt-4 inline-block"
            >
              Go to Proofs →
            </Link>
          </div>
        </div>
      )}

      {/* PATCH_61: Settings Tab - Screening, Training, Projects */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* Screening Selection */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">📋 Screening Test</h3>
              <Link
                href="/admin/workspace/screenings"
                className="text-sm text-slate-400 hover:text-white"
              >
                Manage Screenings →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">
                  Select Screening
                </label>
                <select
                  value={selectedScreeningId}
                  onChange={(e) => setSelectedScreeningId(e.target.value)}
                  className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">No screening</option>
                  {screenings.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={saveScreeningSelection}
                  disabled={saving}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>

          {/* Training Materials */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">📚 Training Materials</h3>
              <button
                onClick={addTrainingMaterial}
                className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-sm hover:bg-blue-500/30"
              >
                + Add Material
              </button>
            </div>

            {trainingForm.length === 0 ? (
              <p className="text-slate-400 text-center py-4">
                No training materials yet
              </p>
            ) : (
              <div className="space-y-4">
                {trainingForm.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Title"
                        value={m.title}
                        onChange={(e) =>
                          updateTrainingMaterial(idx, "title", e.target.value)
                        }
                        className="bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                      />
                      <select
                        value={m.type}
                        onChange={(e) =>
                          updateTrainingMaterial(idx, "type", e.target.value)
                        }
                        className="bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="link">Link</option>
                        <option value="video">Video</option>
                        <option value="pdf">PDF</option>
                      </select>
                      <input
                        type="url"
                        placeholder="URL"
                        value={m.url}
                        onChange={(e) =>
                          updateTrainingMaterial(idx, "url", e.target.value)
                        }
                        className="bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeTrainingMaterial(idx)}
                      className="text-red-400 text-xs mt-2 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={saveTrainingMaterials}
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Training Materials"}
              </button>
            </div>
          </div>

          {/* Projects */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">💼 Projects</h3>
              <div className="flex gap-2">
                {projectMode !== "list" && (
                  <button
                    onClick={() => { setProjectMode("list"); setEditingProject(null); }}
                    className="px-3 py-1 rounded-lg bg-slate-500/20 text-slate-300 text-sm hover:bg-slate-500/30"
                  >
                    ← Back to List
                  </button>
                )}
                {projectMode === "list" && (
                  <button
                    onClick={() => setProjectMode("create")}
                    disabled={Boolean(projectsLockedReason)}
                    className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-sm hover:bg-blue-500/30"
                  >
                    ➕ Create Project
                  </button>
                )}
              </div>
            </div>

            {projectsLockedReason && (
              <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-amber-100">
                <p className="font-semibold">Locked</p>
                <p className="text-sm mt-1">{projectsLockedReason}</p>
              </div>
            )}

            {/* PROJECT LIST */}
            {projectMode === "list" && (
              projects.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="font-medium">No projects yet</p>
                  <p className="text-sm mt-1">Create a project to assign to workers</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((proj) => {
                    const screeningList = (proj as any).screeningIds || [];
                    const legacyScreening = (proj as any).screeningId;
                    return (
                      <div
                        key={proj._id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-lg">{proj.title}</p>
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  proj.status === "open"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : proj.status === "draft"
                                      ? "bg-slate-500/20 text-slate-300"
                                      : proj.status === "assigned" || proj.status === "in_progress"
                                        ? "bg-blue-500/20 text-blue-300"
                                        : proj.status === "completed"
                                          ? "bg-green-500/20 text-green-300"
                                          : "bg-red-500/20 text-red-300"
                                }`}
                              >
                                {proj.status}
                              </span>
                            </div>
                            {proj.description && (
                              <p className="text-sm text-slate-400 mt-1">{proj.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-400">
                              <span>💰 ${proj.payRate} {proj.payType}</span>
                              {proj.deadline && (
                                <span>📅 {new Date(proj.deadline).toLocaleDateString()}</span>
                              )}
                            </div>
                            {/* Show linked screenings */}
                            {(screeningList.length > 0 || legacyScreening) && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                <span className="text-xs text-slate-500">Tests:</span>
                                {screeningList.map((s: any) => (
                                  <span key={s._id || s} className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs">
                                    📋 {s.title || "Screening"}
                                  </span>
                                ))}
                                {screeningList.length === 0 && legacyScreening && (
                                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs">
                                    📋 {typeof legacyScreening === "object" ? legacyScreening.title : "Screening"}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => startEditProject(proj)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/30"
                            >
                              ✏️ Edit
                            </button>
                            {proj.status === "draft" && proj._id && (
                              <button
                                onClick={() => activateProject(proj._id!)}
                                disabled={saving}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30 disabled:opacity-50"
                              >
                                🚀 Activate
                              </button>
                            )}
                            <Link
                              href={`/admin/workspace/projects?action=view&id=${proj._id}`}
                              className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-sm hover:bg-white/10"
                            >
                              View Details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* CREATE PROJECT */}
            {projectMode === "create" && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-300">New Project for {job.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Project Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Valkyrie V4"
                      value={projectForm.title}
                      onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                      className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Pay Rate ($)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={projectForm.payRate}
                      onChange={(e) => setProjectForm({ ...projectForm, payRate: Number(e.target.value) })}
                      className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Description</label>
                  <textarea
                    placeholder="Project description..."
                    value={projectForm.description || ""}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={createProject}
                    disabled={saving}
                    className="btn-primary disabled:opacity-50"
                  >
                    {saving ? "Creating..." : "Create Project"}
                  </button>
                  <button
                    onClick={() => setProjectMode("list")}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* EDIT PROJECT - PATCH_88: Full edit with multi-screening */}
            {projectMode === "edit" && editingProject && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-300">Editing: {editingProject.title}</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Project Title *</label>
                    <input
                      type="text"
                      value={editingProject.title}
                      onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                      className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Pay Rate ($)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={editingProject.payRate}
                      onChange={(e) => setEditingProject({ ...editingProject, payRate: Number(e.target.value) })}
                      className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Description</label>
                  <textarea
                    value={editingProject.description || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                    className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Instructions</label>
                  <textarea
                    placeholder="Detailed task instructions for workers..."
                    value={editingProject.instructions || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, instructions: e.target.value })}
                    className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Pay Type</label>
                    <select
                      value={editingProject.payType}
                      onChange={(e) => setEditingProject({ ...editingProject, payType: e.target.value as any })}
                      className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="per_task">Per Task</option>
                      <option value="hourly">Hourly</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Deadline</label>
                    <input
                      type="date"
                      value={editingProject.deadline ? new Date(editingProject.deadline).toISOString().split("T")[0] : ""}
                      onChange={(e) => setEditingProject({ ...editingProject, deadline: e.target.value })}
                      className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* SCREENING TESTS ASSIGNMENT - Multi-select */}
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-purple-300">📋 Required Screening Tests</h5>
                    <span className="text-xs text-slate-400">{editProjectScreeningIds.length} selected</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Workers must pass ALL selected tests to be eligible for this project
                  </p>
                  {screenings.length === 0 ? (
                    <p className="text-sm text-slate-400">No screening tests available. <Link href="/admin/workspace/screenings" className="text-cyan-400 hover:underline">Create one →</Link></p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {screenings.map((s) => (
                        <label
                          key={s._id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            editProjectScreeningIds.includes(s._id)
                              ? "bg-purple-500/20 border-purple-500/40 text-white"
                              : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={editProjectScreeningIds.includes(s._id)}
                            onChange={() => toggleScreeningId(s._id)}
                            className="rounded border-white/20"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{s.title}</p>
                            <p className="text-xs text-slate-500">
                              Pass: {s.passingScore}% | Time: {s.timeLimit} min
                            </p>
                          </div>
                          <Link
                            href={`/admin/workspace/screenings/${s._id}`}
                            className="text-xs text-cyan-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Edit
                          </Link>
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-purple-500/20">
                    <Link
                      href="/admin/workspace/screenings"
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      ➕ Create New Screening Test
                    </Link>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={saveEditProject}
                    disabled={saving}
                    className="btn-primary disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "💾 Save Project"}
                  </button>
                  <button
                    onClick={() => { setProjectMode("list"); setEditingProject(null); }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
