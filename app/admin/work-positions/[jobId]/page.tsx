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
  payRate: number;
  payType: "per_task" | "hourly" | "fixed";
  deadline?: string;
  status: "draft" | "active" | "completed";
  assignedWorker?: string;
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
  test_submitted: "bg-purple-500/20 text-purple-300",
  failed: "bg-red-500/20 text-red-300",
  ready_to_work: "bg-emerald-500/20 text-emerald-300",
  assigned: "bg-blue-500/20 text-blue-300",
  working: "bg-cyan-500/20 text-cyan-300",
  suspended: "bg-red-500/20 text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  screening_unlocked: "Screening Unlocked",
  test_submitted: "Test Submitted",
  failed: "Failed",
  ready_to_work: "Ready To Work",
  assigned: "Assigned",
  working: "Working",
  suspended: "Suspended",
};

export default function AdminJobRolePage() {
  const params = useParams();
  const { toast } = useToast();
  const jobId = params?.jobId as string;

  const [job, setJob] = useState<JobRole | null>(null);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "applicants" | "screening" | "training" | "projects"
  >("applicants");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  // Training materials form
  const [trainingForm, setTrainingForm] = useState<TrainingMaterial[]>([]);

  // PATCH_52A: Centralized screening selection
  const [screenings, setScreenings] = useState<ScreeningOption[]>([]);
  const [selectedScreeningId, setSelectedScreeningId] = useState<string>("");

  // PATCH_46: Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectForm, setProjectForm] = useState<Project>({
    title: "",
    description: "",
    payRate: 0,
    payType: "per_task",
    status: "draft",
  });
  const [projectMode, setProjectMode] = useState<"list" | "create">("list");

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
    } catch (e: any) {
      console.log("Projects not available yet");
    }
  };

  const createProject = async () => {
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
    setSaving(true);
    try {
      await apiRequest(
        `/api/admin/workspace/job/${jobId}/projects/${projectId}/assign`,
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

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "applicants", label: "Applicants", icon: "👥" },
          { id: "screening", label: "Screening Setup", icon: "📋" },
          { id: "training", label: "Training Materials", icon: "📚" },
          { id: "projects", label: "Projects", icon: "💼" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white/10 text-white border border-white/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applicants Tab */}
      {activeTab === "applicants" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="screening_unlocked">Screening Unlocked</option>
              <option value="test_submitted">Test Submitted</option>
              <option value="failed">Failed</option>
              <option value="ready_to_work">Ready To Work</option>
              <option value="assigned">Assigned</option>
              <option value="working">Working</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Applicant List */}
          {applicants.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-slate-400">No applicants found</p>
            </div>
          ) : (
            applicants.map((app) => (
              <div key={app._id} className="card">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {app.user?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-slate-400">{app.user?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[app.workerStatus] || "bg-slate-500/20 text-slate-300"}`}
                      >
                        {STATUS_LABELS[app.workerStatus] || app.workerStatus}
                      </span>
                      <span className="text-xs text-slate-500">
                        Attempts: {app.attemptCount}/{app.maxAttempts}
                      </span>
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
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectApplicant(app._id)}
                            disabled={saving}
                            className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 disabled:opacity-50"
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
                          className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-sm hover:bg-amber-500/30 disabled:opacity-50"
                        >
                          Unlock Screening
                        </button>
                      )}
                    {app.workerStatus === "failed" && (
                      <button
                        onClick={() =>
                          setWorkerStatus(app._id, "screening_unlocked", true)
                        }
                        disabled={saving}
                        className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-sm hover:bg-amber-500/30 disabled:opacity-50"
                      >
                        Reset & Retry
                      </button>
                    )}
                    {(app.workerStatus === "screening_unlocked" ||
                      app.workerStatus === "test_submitted") && (
                      <button
                        onClick={() =>
                          setWorkerStatus(app._id, "ready_to_work")
                        }
                        disabled={saving}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30 disabled:opacity-50"
                      >
                        Force Ready
                      </button>
                    )}
                    {app.workerStatus === "ready_to_work" && (
                      <button
                        onClick={() => setWorkerStatus(app._id, "assigned")}
                        disabled={saving}
                        className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-sm hover:bg-blue-500/30 disabled:opacity-50"
                      >
                        Assign
                      </button>
                    )}
                    {app.workerStatus !== "suspended" && (
                      <button
                        onClick={() => setWorkerStatus(app._id, "suspended")}
                        disabled={saving}
                        className="px-3 py-1 rounded-lg bg-slate-500/20 text-slate-300 text-sm hover:bg-slate-500/30 disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Screening Tab - PATCH_52A: Centralized Selection */}
      {activeTab === "screening" && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">📋 Screening Selection</h3>
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
              <p className="text-xs text-slate-500 mt-2">
                Job roles only select existing screenings. Edit screenings in
                the workspace screenings manager.
              </p>
            </div>
            <div className="flex items-end">
              <button
                onClick={saveScreeningSelection}
                disabled={saving}
                className="btn-primary w-full disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Screening"}
              </button>
            </div>
          </div>

          {selectedScreening ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-lg">
                    {selectedScreening.title}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="text-emerald-400">✓</span>
                      Pass: {selectedScreening.passingScore}%
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-blue-400">⏱</span>
                      Time: {selectedScreening.timeLimit} min
                    </span>
                  </div>
                </div>
                {selectedScreeningId && (
                  <Link
                    href={`/admin/workspace/screenings/${selectedScreeningId}`}
                    className="btn-secondary text-sm"
                  >
                    Edit Screening
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <div className="text-3xl mb-2">📝</div>
              <p className="font-medium">No screening selected</p>
              <p className="text-sm mt-1">
                Select an existing screening from the dropdown.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Training Materials Tab */}
      {activeTab === "training" && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Training Materials</h3>
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
      )}

      {/* Projects Tab - PATCH_46: Full Project Management */}
      {activeTab === "projects" && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">💼 Project Management</h3>
            {projectMode === "list" && (
              <button
                onClick={() => setProjectMode("create")}
                className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-sm hover:bg-blue-500/30"
              >
                ➕ Create Project
              </button>
            )}
          </div>

          {projectMode === "list" ? (
            // List Mode
            <>
              {projects.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="font-medium">No projects yet</p>
                  <p className="text-sm mt-2">
                    Create projects to assign work to ready workers.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((proj) => (
                    <div
                      key={proj._id}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-medium">{proj.title}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-400">
                          <span>
                            💰 ${proj.payRate} {proj.payType}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              proj.status === "active"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : proj.status === "completed"
                                  ? "bg-blue-500/20 text-blue-300"
                                  : "bg-slate-500/20 text-slate-300"
                            }`}
                          >
                            {proj.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {proj.status === "draft" && (
                          <button className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30">
                            Activate
                          </button>
                        )}
                        {proj.status === "active" && !proj.assignedWorker && (
                          <button className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-sm hover:bg-blue-500/30">
                            Assign Worker
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Ready Workers for Assignment */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium mb-3">
                  🟢 Ready Workers (
                  {
                    applicants.filter((a) => a.workerStatus === "ready_to_work")
                      .length
                  }
                  )
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {applicants
                    .filter((a) => a.workerStatus === "ready_to_work")
                    .map((worker) => (
                      <div
                        key={worker._id}
                        className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {worker.user?.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {worker.user?.email}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setWorkerStatus(worker._id, "assigned")
                          }
                          disabled={saving}
                          className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs hover:bg-blue-500/30"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  {applicants.filter((a) => a.workerStatus === "ready_to_work")
                    .length === 0 && (
                    <p className="text-sm text-slate-500 col-span-2">
                      No workers ready for assignment yet.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Create Mode
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Project Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Data Entry Batch #1"
                    value={projectForm.title}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, title: e.target.value })
                    }
                    className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Pay Type
                  </label>
                  <select
                    value={projectForm.payType}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        payType: e.target.value as any,
                      })
                    }
                    className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="per_task">Per Task</option>
                    <option value="hourly">Hourly</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Pay Rate ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={projectForm.payRate}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        payRate: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Deadline (optional)
                  </label>
                  <input
                    type="date"
                    value={projectForm.deadline || ""}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        deadline: e.target.value,
                      })
                    }
                    className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Description
                </label>
                <textarea
                  placeholder="Describe the project tasks and requirements..."
                  value={projectForm.description || ""}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={createProject}
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? "Creating..." : "📦 Create Project"}
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
        </div>
      )}
    </div>
  );
}
