"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

/**
 * PATCH_43: Admin Job Role Control Panel
 * PATCH_46: Enhanced UX with Screening Editor, Projects Tab, and Human-Friendly Actions
 * Manage applicants, screenings, training materials, and worker assignments
 */

type ScreeningQuestion = {
  _id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
};

type Screening = {
  _id?: string;
  title: string;
  description?: string;
  questions: ScreeningQuestion[];
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
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
  const router = useRouter();
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

  // PATCH_46: Screening editor state
  const [screeningForm, setScreeningForm] = useState<Screening>({
    title: "",
    description: "",
    questions: [],
    timeLimit: 30,
    passingScore: 70,
    maxAttempts: 3,
  });
  const [screeningMode, setScreeningMode] = useState<"view" | "edit">("view");

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

  useEffect(() => {
    loadJob();
    loadApplicants();
    loadProjects();
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

  // PATCH_46: Screening Editor Functions
  const addQuestion = () => {
    setScreeningForm({
      ...screeningForm,
      questions: [
        ...screeningForm.questions,
        { question: "", options: ["", "", "", ""], correctAnswer: 0 },
      ],
    });
  };

  const removeQuestion = (idx: number) => {
    setScreeningForm({
      ...screeningForm,
      questions: screeningForm.questions.filter((_, i) => i !== idx),
    });
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    const updated = [...screeningForm.questions];
    (updated[idx] as any)[field] = value;
    setScreeningForm({ ...screeningForm, questions: updated });
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    const updated = [...screeningForm.questions];
    updated[qIdx].options[optIdx] = value;
    setScreeningForm({ ...screeningForm, questions: updated });
  };

  const saveScreening = async () => {
    if (!screeningForm.title || screeningForm.questions.length === 0) {
      toast("Please add a title and at least one question", "error");
      return;
    }
    setSaving(true);
    try {
      await apiRequest(
        `/api/admin/workspace/job/${jobId}/set-screening`,
        "PUT",
        { screening: screeningForm },
        true,
      );
      toast("Screening saved successfully", "success");
      setScreeningMode("view");
      loadJob();
    } catch (e: any) {
      toast(e?.message || "Failed to save screening", "error");
    } finally {
      setSaving(false);
    }
  };

  const startEditScreening = () => {
    if (job?.screeningId) {
      // Load existing screening data
      setScreeningForm({
        _id: job.screeningId._id,
        title: job.screeningId.title,
        description: "",
        questions: [],
        timeLimit: job.screeningId.timeLimit,
        passingScore: job.screeningId.passingScore,
        maxAttempts: 3,
      });
    }
    setScreeningMode("edit");
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

      {/* Screening Tab - PATCH_46: Full Screening Editor */}
      {activeTab === "screening" && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">📋 Screening Test Builder</h3>
            {screeningMode === "view" && (
              <button
                onClick={startEditScreening}
                className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-sm hover:bg-blue-500/30"
              >
                {job.screeningId ? "✏️ Edit Screening" : "➕ Create Screening"}
              </button>
            )}
          </div>

          {screeningMode === "view" ? (
            // View Mode
            job.screeningId ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="font-medium text-lg">{job.screeningId.title}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="text-emerald-400">✓</span>
                      Pass: {job.screeningId.passingScore}%
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-blue-400">⏱</span>
                      Time: {job.screeningId.timeLimit} min
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Click "Edit Screening" to modify questions, time limit, or
                  passing score.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-3">📝</div>
                <p className="font-medium">No screening test yet</p>
                <p className="text-sm mt-2">
                  Create a screening test to evaluate worker knowledge before
                  they start working.
                </p>
              </div>
            )
          ) : (
            // Edit Mode - Full Screening Editor
            <div className="space-y-6">
              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Test Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Data Entry Skills Test"
                    value={screeningForm.title}
                    onChange={(e) =>
                      setScreeningForm({
                        ...screeningForm,
                        title: e.target.value,
                      })
                    }
                    className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Time Limit (min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={screeningForm.timeLimit}
                    onChange={(e) =>
                      setScreeningForm({
                        ...screeningForm,
                        timeLimit: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Pass Score (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={screeningForm.passingScore}
                    onChange={(e) =>
                      setScreeningForm({
                        ...screeningForm,
                        passingScore: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={screeningForm.maxAttempts}
                    onChange={(e) =>
                      setScreeningForm({
                        ...screeningForm,
                        maxAttempts: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">
                    Questions ({screeningForm.questions.length})
                  </label>
                  <button
                    onClick={addQuestion}
                    className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30"
                  >
                    ➕ Add Question
                  </button>
                </div>

                {screeningForm.questions.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-white/20 rounded-xl text-slate-400">
                    <p>No questions yet. Click "Add Question" to start.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {screeningForm.questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">
                            Q{qIdx + 1}
                          </span>
                          <button
                            onClick={() => removeQuestion(qIdx)}
                            className="text-red-400 text-xs hover:text-red-300"
                          >
                            🗑 Remove
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder="Enter your question..."
                          value={q.question}
                          onChange={(e) =>
                            updateQuestion(qIdx, "question", e.target.value)
                          }
                          className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm mb-3"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className="flex items-center gap-2"
                            >
                              <button
                                onClick={() =>
                                  updateQuestion(qIdx, "correctAnswer", optIdx)
                                }
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition ${
                                  q.correctAnswer === optIdx
                                    ? "bg-emerald-500 text-white"
                                    : "bg-white/10 text-slate-400 hover:bg-white/20"
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </button>
                              <input
                                type="text"
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                value={opt}
                                onChange={(e) =>
                                  updateOption(qIdx, optIdx, e.target.value)
                                }
                                className="flex-1 bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Click a letter button to mark it as the correct answer
                          (currently:{" "}
                          {String.fromCharCode(65 + q.correctAnswer)})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={saveScreening}
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? "Saving..." : "💾 Save Screening"}
                </button>
                <button
                  onClick={() => setScreeningMode("view")}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
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
