"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { WorkPosition, WorkerStatus } from "@/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/workforce-state-machine";

interface JobWithStats extends WorkPosition {
  applicantStats?: Record<string, number>;
}

interface Applicant {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  workerStatus: WorkerStatus;
  screeningsCompleted?: Array<{
    screeningId: string;
    score: number;
    passed: boolean;
  }>;
  totalEarnings?: number;
  tier?: string;
}

export function JobRolesTab() {
  const qc = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Jobs list ─── */
  const jobsQuery = useQuery<{
    ok: boolean;
    jobs: JobWithStats[];
    total: number;
  }>({
    queryKey: ["admin-jobs", activeOnly],
    queryFn: () =>
      apiRequest(
        `${EP.ADMIN_WORKSPACE_JOBS}?active=${activeOnly}&limit=100`,
        "GET",
        undefined,
        true,
      ),
  });

  const jobs = jobsQuery.data?.jobs ?? [];

  return (
    <div className="flex flex-col gap-4">
      {toast && (
        <div
          className={`rounded-md px-3 py-2 text-xs font-medium ${toast.ok ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveOnly(true)}
          className={`rounded px-2.5 py-1 text-xs font-medium ${activeOnly ? "bg-emerald-500/20 text-emerald-400" : "text-[var(--muted)] hover:text-white"}`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveOnly(false)}
          className={`rounded px-2.5 py-1 text-xs font-medium ${!activeOnly ? "bg-gray-500/20 text-gray-300" : "text-[var(--muted)] hover:text-white"}`}
        >
          All
        </button>
        <span className="ml-auto text-xs text-[var(--muted)]">
          {jobsQuery.data?.total ?? 0} roles
        </span>
      </div>

      {/* Jobs grid */}
      {jobsQuery.isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--muted)]">
          No job roles found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const stats = job.applicantStats ?? {};
            const totalApplicants = Object.values(stats).reduce(
              (a, b) => a + b,
              0,
            );
            return (
              <button
                key={job._id}
                onClick={() => setSelectedJob(job._id)}
                className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4 text-left transition-colors hover:border-blue-500/40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white/90">
                      {job.title}
                    </h4>
                    <span className="text-[10px] text-[var(--muted)]">
                      {job.category}
                    </span>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${job.active ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}
                  >
                    {job.active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Stat badges */}
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                    {totalApplicants} applicants
                  </span>
                  {job.hasScreening && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                      Screening
                    </span>
                  )}
                  {(job.trainingMaterials?.length ?? 0) > 0 && (
                    <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400">
                      {job.trainingMaterials!.length} training
                    </span>
                  )}
                </div>

                {/* Per-status breakdown */}
                {totalApplicants > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(stats)
                      .filter(([, n]) => n > 0)
                      .map(([status, count]) => {
                        const sc = STATUS_COLORS[status as WorkerStatus];
                        return (
                          <span
                            key={status}
                            className={`rounded px-1 py-0.5 text-[9px] font-medium ${sc?.bg ?? "bg-gray-500/15"} ${sc?.text ?? "text-gray-400"}`}
                          >
                            {count}{" "}
                            {STATUS_LABELS[status as WorkerStatus] ?? status}
                          </span>
                        );
                      })}
                  </div>
                )}

                <div className="mt-2 font-mono text-[9px] text-[var(--muted)]">
                  {job._id}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Job Detail Panel */}
      {selectedJob && (
        <JobDetailPanel
          jobId={selectedJob}
          onClose={() => setSelectedJob(null)}
          onRefresh={() => qc.invalidateQueries({ queryKey: ["admin-jobs"] })}
          showToast={showToast}
        />
      )}
    </div>
  );
}

/* ─── Job Detail Panel ─── */
function JobDetailPanel({
  jobId,
  onClose,
  onRefresh,
  showToast,
}: {
  jobId: string;
  onClose: () => void;
  onRefresh: () => void;
  showToast: (msg: string, ok: boolean) => void;
}) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<
    "detail" | "applicants" | "projects" | "training"
  >("detail");
  const [statusFilterApplicants, setStatusFilterApplicants] = useState("");

  /* ─── Job detail ─── */
  const { data, isLoading, refetch } = useQuery<{
    ok: boolean;
    job: WorkPosition & { applicantStats?: Record<string, number> };
    stats: Record<string, number>;
  }>({
    queryKey: ["admin-job-detail", jobId],
    queryFn: () =>
      apiRequest(EP.ADMIN_WORKSPACE_JOB(jobId), "GET", undefined, true),
  });

  /* ─── Applicants ─── */
  const applicantsQuery = useQuery<{
    ok: boolean;
    applicants: Applicant[];
    total: number;
    page: number;
    pages: number;
  }>({
    queryKey: ["admin-job-applicants", jobId, statusFilterApplicants],
    queryFn: () => {
      const params = statusFilterApplicants
        ? `?workerStatus=${statusFilterApplicants}&limit=50`
        : "?limit=50";
      return apiRequest(
        `${EP.ADMIN_WORKSPACE_JOB_APPLICANTS(jobId)}${params}`,
        "GET",
        undefined,
        true,
      );
    },
    enabled: tab === "applicants",
  });

  /* ─── Job projects ─── */
  const projectsQuery = useQuery<{
    ok: boolean;
    projects: Array<Record<string, unknown>>;
    total: number;
  }>({
    queryKey: ["admin-job-projects", jobId],
    queryFn: () =>
      apiRequest(
        EP.ADMIN_WORKSPACE_JOB_PROJECTS(jobId),
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "projects",
  });

  if (isLoading || !data?.job) {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
        <div className="flex h-32 w-64 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  const job = data.job;
  const stats = data.stats ?? job.applicantStats ?? {};

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{job.title}</h3>
            <div className="flex gap-2">
              <span className="text-[10px] text-[var(--muted)]">
                {job.category}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${job.active ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}
              >
                {job.active ? "Active" : "Inactive"}
              </span>
            </div>
            <span className="font-mono text-[10px] text-[var(--muted)]">
              ID: {job._id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--muted)] hover:bg-white/10 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="mt-4 flex gap-1 border-b border-[var(--border)]">
          {(["detail", "applicants", "projects", "training"] as const).map(
            (t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`border-b-2 px-3 py-2 text-xs font-medium capitalize transition-colors ${tab === t ? "border-blue-500 text-white" : "border-transparent text-[var(--muted)] hover:text-white"}`}
              >
                {t}
              </button>
            ),
          )}
        </div>

        <div className="mt-4">
          {tab === "detail" && (
            <JobDetailView
              job={job}
              stats={stats}
              onRefresh={() => {
                refetch();
                onRefresh();
              }}
              showToast={showToast}
            />
          )}
          {tab === "applicants" && (
            <ApplicantsView
              jobId={jobId}
              applicants={applicantsQuery.data?.applicants ?? []}
              isLoading={applicantsQuery.isLoading}
              total={applicantsQuery.data?.total ?? 0}
              statusFilter={statusFilterApplicants}
              onStatusFilter={setStatusFilterApplicants}
              onRefresh={() => {
                applicantsQuery.refetch();
                qc.invalidateQueries({ queryKey: ["admin-job-detail", jobId] });
                onRefresh();
              }}
              showToast={showToast}
            />
          )}
          {tab === "projects" && (
            <JobProjectsView
              jobId={jobId}
              projects={projectsQuery.data?.projects ?? []}
              isLoading={projectsQuery.isLoading}
              onRefresh={() => {
                projectsQuery.refetch();
                onRefresh();
              }}
              showToast={showToast}
            />
          )}
          {tab === "training" && (
            <TrainingView
              jobId={jobId}
              materials={job.trainingMaterials ?? []}
              onRefresh={() => {
                refetch();
                onRefresh();
              }}
              showToast={showToast}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Detail View ─── */
function JobDetailView({
  job,
  stats,
  onRefresh,
  showToast,
}: {
  job: WorkPosition & { applicantStats?: Record<string, number> };
  stats: Record<string, number>;
  onRefresh: () => void;
  showToast: (msg: string, ok: boolean) => void;
}) {
  const [screeningId, setScreeningId] = useState(job.screeningId ?? "");
  const [screeningIdsList, setScreeningIdsList] = useState(
    (job.screeningIds ?? []).join(", "),
  );

  const setScreeningMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest(
        EP.ADMIN_WORKSPACE_JOB_SET_SCREENING(job._id),
        "PUT",
        body,
        true,
      ),
    onSuccess: () => {
      showToast("Screening updated", true);
      onRefresh();
    },
    onError: (e: Error) => showToast(e.message || "Failed", false),
  });

  const totalApplicants = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Status breakdown */}
      <div>
        <div className="mb-2 text-[10px] font-semibold uppercase text-[var(--muted)]">
          Applicant Breakdown ({totalApplicants} total)
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {Object.entries(stats)
            .filter(([, n]) => n > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([status, count]) => {
              const sc = STATUS_COLORS[status as WorkerStatus];
              return (
                <div
                  key={status}
                  className={`rounded border border-[var(--border)] px-2 py-1.5 ${sc?.bg ?? "bg-white/5"}`}
                >
                  <div
                    className={`text-sm font-bold tabular-nums ${sc?.text ?? "text-white"}`}
                  >
                    {count}
                  </div>
                  <div className="text-[9px] text-[var(--muted)]">
                    {STATUS_LABELS[status as WorkerStatus] ?? status}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase text-[var(--muted)]">
            Description
          </div>
          <p className="text-xs text-white/80">{job.description}</p>
        </div>
      )}

      {/* Requirements */}
      {job.requirements && (
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase text-[var(--muted)]">
            Requirements
          </div>
          <p className="text-xs text-white/80">{job.requirements}</p>
        </div>
      )}

      {/* Screening config */}
      <div className="rounded border border-[var(--border)] bg-black/20 p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase text-[var(--muted)]">
          Screening Configuration
        </div>
        <div className="mb-1 flex items-center gap-2 text-xs">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${job.hasScreening ? "bg-amber-500/15 text-amber-400" : "bg-gray-500/15 text-gray-400"}`}
          >
            {job.hasScreening ? "Screening Required" : "No Screening"}
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          <div>
            <label className="mb-0.5 block text-[10px] text-[var(--muted)]">
              Primary Screening ID
            </label>
            <input
              value={screeningId}
              onChange={(e) => setScreeningId(e.target.value)}
              placeholder="Screening ObjectId..."
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2 py-1 font-mono text-[11px] text-white"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] text-[var(--muted)]">
              Additional Screening IDs (comma-separated)
            </label>
            <input
              value={screeningIdsList}
              onChange={(e) => setScreeningIdsList(e.target.value)}
              placeholder="id1, id2, ..."
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2 py-1 font-mono text-[11px] text-white"
            />
          </div>
          <button
            onClick={() => {
              const body: Record<string, unknown> = {};
              if (screeningId.trim()) body.screeningId = screeningId.trim();
              const ids = screeningIdsList
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              if (ids.length > 0) body.screeningIds = ids;
              setScreeningMutation.mutate(body);
            }}
            disabled={setScreeningMutation.isPending}
            className="w-fit rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {setScreeningMutation.isPending ? "Saving..." : "Update Screening"}
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="flex gap-4 text-[11px] text-[var(--muted)]">
        <span>Sort Order: {job.sortOrder}</span>
        <span>Created: {new Date(job.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

/* ─── Applicants View ─── */
function ApplicantsView({
  jobId,
  applicants,
  isLoading,
  total,
  statusFilter,
  onStatusFilter,
  onRefresh,
  showToast,
}: {
  jobId: string;
  applicants: Applicant[];
  isLoading: boolean;
  total: number;
  statusFilter: string;
  onStatusFilter: (s: string) => void;
  onRefresh: () => void;
  showToast: (msg: string, ok: boolean) => void;
}) {
  const STATUS_FILTERS: WorkerStatus[] = [
    "applied",
    "screening_unlocked",
    "training_viewed",
    "test_submitted",
    "ready_to_work",
    "assigned",
    "working",
    "suspended",
    "failed",
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => onStatusFilter("")}
          className={`rounded px-2 py-1 text-[10px] font-medium ${!statusFilter ? "bg-blue-500/20 text-blue-400" : "text-[var(--muted)] hover:text-white"}`}
        >
          All ({total})
        </button>
        {STATUS_FILTERS.map((s) => {
          const sc = STATUS_COLORS[s];
          return (
            <button
              key={s}
              onClick={() => onStatusFilter(statusFilter === s ? "" : s)}
              className={`rounded px-2 py-1 text-[10px] font-medium ${statusFilter === s ? `${sc.bg} ${sc.text}` : "text-[var(--muted)] hover:text-white"}`}
            >
              {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex h-20 items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : applicants.length === 0 ? (
        <div className="py-6 text-center text-xs text-[var(--muted)]">
          No applicants with this status
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--panel)]">
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Worker
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Status
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Tier
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Earnings
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((a) => (
                <ApplicantRow
                  key={a._id}
                  applicant={a}
                  jobId={jobId}
                  onRefresh={onRefresh}
                  showToast={showToast}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Single Applicant Row ─── */
function ApplicantRow({
  applicant,
  jobId,
  onRefresh,
  showToast,
}: {
  applicant: Applicant;
  jobId: string;
  onRefresh: () => void;
  showToast: (msg: string, ok: boolean) => void;
}) {
  const a = applicant;
  const sc = STATUS_COLORS[a.workerStatus];

  /* Approve */
  const approveMutation = useMutation({
    mutationFn: () =>
      apiRequest(
        EP.ADMIN_WORKSPACE_JOB_APPROVE(jobId),
        "PUT",
        { applicantId: a._id },
        true,
      ),
    onSuccess: () => {
      showToast("Applicant approved", true);
      onRefresh();
    },
    onError: (e: Error) => showToast(e.message || "Approve failed", false),
  });

  /* Reject */
  const rejectMutation = useMutation({
    mutationFn: () =>
      apiRequest(
        EP.ADMIN_WORKSPACE_JOB_REJECT(jobId),
        "PUT",
        { applicantId: a._id, reason: "Admin decision" },
        true,
      ),
    onSuccess: () => {
      showToast("Applicant rejected", true);
      onRefresh();
    },
    onError: (e: Error) => showToast(e.message || "Reject failed", false),
  });

  /* Unlock screening */
  const unlockMutation = useMutation({
    mutationFn: () =>
      apiRequest(
        EP.ADMIN_WORKSPACE_JOB_UNLOCK_SCREENING(jobId),
        "PUT",
        { applicantId: a._id },
        true,
      ),
    onSuccess: () => {
      showToast("Screening unlocked", true);
      onRefresh();
    },
    onError: (e: Error) => showToast(e.message || "Unlock failed", false),
  });

  const busy =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    unlockMutation.isPending;

  return (
    <tr className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02]">
      <td className="px-3 py-2">
        <div className="text-white/90">
          {a.userId?.name ||
            `${a.userId?.firstName ?? ""} ${a.userId?.lastName ?? ""}`.trim() ||
            a.userId?.email}
        </div>
        <div className="font-mono text-[9px] text-[var(--muted)]">{a._id}</div>
      </td>
      <td className="px-3 py-2">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${sc?.bg} ${sc?.text}`}
        >
          {STATUS_LABELS[a.workerStatus] ?? a.workerStatus}
        </span>
      </td>
      <td className="px-3 py-2 text-[var(--muted)]">{a.tier ?? "--"}</td>
      <td className="px-3 py-2 font-mono text-emerald-400/80">
        ${a.totalEarnings ?? 0}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {a.workerStatus === "applied" && (
            <>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={busy}
                className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={busy}
                className="rounded bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400 hover:bg-red-500/25 disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          {(a.workerStatus === "applied" || a.workerStatus === "failed") && (
            <button
              onClick={() => unlockMutation.mutate()}
              disabled={busy}
              className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400 hover:bg-amber-500/25 disabled:opacity-50"
            >
              Unlock Screening
            </button>
          )}
          {a.workerStatus === "test_submitted" && (
            <button
              onClick={() => approveMutation.mutate()}
              disabled={busy}
              className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
            >
              Approve
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─── Job Projects View ─── */
function JobProjectsView({
  jobId,
  projects,
  isLoading,
  onRefresh,
  showToast,
}: {
  jobId: string;
  projects: Array<Record<string, unknown>>;
  isLoading: boolean;
  onRefresh: () => void;
  showToast: (msg: string, ok: boolean) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payRate, setPayRate] = useState("0");
  const [payType, setPayType] = useState<"per_task" | "hourly" | "fixed">(
    "per_task",
  );
  const [deadline, setDeadline] = useState("");

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest(EP.ADMIN_WORKSPACE_JOB_PROJECTS(jobId), "POST", body, true),
    onSuccess: () => {
      showToast("Project created under job role", true);
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      onRefresh();
    },
    onError: (e: Error) => showToast(e.message || "Create failed", false),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">
          {projects.length} projects
        </span>
        <button
          onClick={() => setCreateOpen(!createOpen)}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500"
        >
          + New Project
        </button>
      </div>

      {createOpen && (
        <div className="rounded border border-[var(--border)] bg-black/20 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="mb-0.5 block text-[10px] text-[var(--muted)]">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-xs text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-0.5 block text-[10px] text-[var(--muted)]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] text-[var(--muted)]">
                Pay Rate
              </label>
              <input
                type="number"
                value={payRate}
                onChange={(e) => setPayRate(e.target.value)}
                className="w-full rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] text-[var(--muted)]">
                Pay Type
              </label>
              <select
                value={payType}
                onChange={(e) => setPayType(e.target.value as typeof payType)}
                className="w-full rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-xs text-white"
              >
                <option value="per_task">Per Task</option>
                <option value="hourly">Hourly</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] text-[var(--muted)]">
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-xs text-white"
              />
            </div>
          </div>
          <button
            onClick={() =>
              title &&
              createMutation.mutate({
                title,
                description,
                payRate: Number(payRate),
                payType,
                ...(deadline ? { deadline } : {}),
              })
            }
            disabled={!title || createMutation.isPending}
            className="mt-2 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create"}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-16 items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        <div className="py-6 text-center text-xs text-[var(--muted)]">
          No projects linked
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <div
              key={p._id as string}
              className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--panel)] px-3 py-2"
            >
              <div>
                <div className="text-xs text-white/90">{p.title as string}</div>
                <div className="font-mono text-[9px] text-[var(--muted)]">
                  {p._id as string}
                </div>
              </div>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                {p.status as string}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Training View ─── */
function TrainingView({
  jobId,
  materials,
  onRefresh,
  showToast,
}: {
  jobId: string;
  materials: Array<{
    title: string;
    type: "link" | "pdf" | "video";
    url: string;
    description?: string;
  }>;
  onRefresh: () => void;
  showToast: (msg: string, ok: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState(materials);

  const saveMutation = useMutation({
    mutationFn: (trainingMaterials: typeof items) =>
      apiRequest(
        EP.ADMIN_WORKSPACE_JOB_SET_TRAINING(jobId),
        "PUT",
        { trainingMaterials },
        true,
      ),
    onSuccess: () => {
      showToast("Training materials updated", true);
      setEditing(false);
      onRefresh();
    },
    onError: (e: Error) => showToast(e.message || "Save failed", false),
  });

  const addItem = () =>
    setItems([...items, { title: "", type: "link", url: "", description: "" }]);
  const removeItem = (i: number) =>
    setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: string) =>
    setItems(
      items.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)),
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">
          {materials.length} materials
        </span>
        <button
          onClick={() => setEditing(!editing)}
          className="rounded bg-amber-600/20 px-3 py-1 text-xs font-medium text-amber-400 hover:bg-amber-600/30"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-2 rounded border border-[var(--border)] bg-black/20 p-2"
            >
              <input
                value={item.title}
                onChange={(e) => updateItem(i, "title", e.target.value)}
                placeholder="Title"
                className="col-span-3 rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-xs text-white"
              />
              <select
                value={item.type}
                onChange={(e) => updateItem(i, "type", e.target.value)}
                className="col-span-2 rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-xs text-white"
              >
                <option value="link">Link</option>
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
              </select>
              <input
                value={item.url}
                onChange={(e) => updateItem(i, "url", e.target.value)}
                placeholder="URL"
                className="col-span-4 rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-xs text-white"
              />
              <input
                value={item.description ?? ""}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                placeholder="Desc"
                className="col-span-2 rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-xs text-white"
              />
              <button
                onClick={() => removeItem(i)}
                className="col-span-1 rounded bg-red-500/15 text-[10px] text-red-400 hover:bg-red-500/25"
              >
                X
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={addItem}
              className="rounded bg-white/5 px-3 py-1 text-xs text-[var(--muted)] hover:text-white"
            >
              + Add Material
            </button>
            <button
              onClick={() => saveMutation.mutate(items)}
              disabled={saveMutation.isPending}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>
      ) : materials.length === 0 ? (
        <div className="py-6 text-center text-xs text-[var(--muted)]">
          No training materials configured
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {materials.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded border border-[var(--border)] bg-[var(--panel)] px-3 py-2"
            >
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${m.type === "video" ? "bg-purple-500/15 text-purple-400" : m.type === "pdf" ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"}`}
              >
                {m.type}
              </span>
              <div className="flex-1">
                <div className="text-xs text-white/90">{m.title}</div>
                {m.description && (
                  <div className="text-[10px] text-[var(--muted)]">
                    {m.description}
                  </div>
                )}
              </div>
              <a
                href={m.url}
                target="_blank"
                rel="noopener"
                className="text-[10px] text-blue-400 hover:underline"
              >
                Open
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
