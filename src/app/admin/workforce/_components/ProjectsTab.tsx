"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Project, ProjectStatus } from "@/types";
import { PROJECT_STATUS_COLORS } from "@/lib/workforce-state-machine";

const PROJECT_STATUSES: ProjectStatus[] = [
  "draft",
  "open",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
];

interface EligibleWorker {
  _id: string;
  userId: {
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  position: { title: string; category: string };
  workerStatus: string;
  totalEarnings: number;
}

export function ProjectsTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Projects list ─── */
  const projectsQuery = useQuery<{ projects: Project[] }>({
    queryKey: ["admin-projects", statusFilter],
    queryFn: () => {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      return apiRequest(
        `${EP.ADMIN_WORKSPACE_PROJECTS}${params}`,
        "GET",
        undefined,
        true,
      );
    },
  });

  /* ─── Create project ─── */
  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest(EP.ADMIN_WORKSPACE_PROJECTS, "POST", body, true),
    onSuccess: () => {
      showToast("Project created", true);
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (e: Error) => showToast(e.message || "Create failed", false),
  });

  const projects = projectsQuery.data?.projects ?? [];

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
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStatusFilter("")}
          className={`rounded px-2.5 py-1 text-xs font-medium ${!statusFilter ? "bg-blue-500/20 text-blue-400" : "text-[var(--muted)] hover:text-white"}`}
        >
          All
        </button>
        {PROJECT_STATUSES.map((s) => {
          const c = PROJECT_STATUS_COLORS[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={`rounded px-2.5 py-1 text-xs font-medium ${statusFilter === s ? `${c.bg} ${c.text}` : "text-[var(--muted)] hover:text-white"}`}
            >
              {s.replace("_", " ")}
            </button>
          );
        })}
        <button
          onClick={() => setCreateOpen(true)}
          className="ml-auto rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
        >
          + New Project
        </button>
      </div>

      {/* Project list */}
      {projectsQuery.isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--muted)]">
          No projects found
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--panel)]">
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Title
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Status
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Type
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Category
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Worker
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Pay
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Credited
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Deadline
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const sc = PROJECT_STATUS_COLORS[p.status] ?? {
                  bg: "bg-gray-500/15",
                  text: "text-gray-400",
                };
                const worker =
                  typeof p.assignedTo === "object" && p.assignedTo
                    ? (p.assignedTo as unknown as Record<string, string>)
                    : null;
                const pos =
                  typeof p.workPositionId === "object" && p.workPositionId
                    ? (p.workPositionId as unknown as Record<string, string>)
                    : null;
                return (
                  <tr
                    key={p._id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setSelectedProject(p._id)}
                        className="text-left text-white/90 hover:underline"
                      >
                        {p.title}
                      </button>
                      {pos && (
                        <div className="text-[10px] text-[var(--muted)]">
                          {pos.title}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${sc.bg} ${sc.text}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[var(--muted)]">
                      {p.projectType}
                    </td>
                    <td className="px-3 py-2 text-[var(--muted)]">
                      {p.category}
                    </td>
                    <td className="px-3 py-2">
                      {worker ? (
                        <span className="text-white/80">
                          {worker.name || worker.email}
                        </span>
                      ) : (
                        <span className="text-[var(--muted)]">--</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums text-emerald-400/80">
                      ${p.payRate}/{p.payType}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums text-[var(--muted)]">
                      ${p.earningsCredited ?? 0}
                    </td>
                    <td className="px-3 py-2 text-[var(--muted)]">
                      {p.deadline
                        ? new Date(p.deadline).toLocaleDateString()
                        : "--"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setSelectedProject(p._id)}
                        className="rounded bg-blue-500/15 px-2 py-1 text-[10px] font-medium text-blue-400 hover:bg-blue-500/25"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Project Inspector */}
      {selectedProject && (
        <ProjectInspector
          projectId={selectedProject}
          onClose={() => setSelectedProject(null)}
          onRefresh={() =>
            qc.invalidateQueries({ queryKey: ["admin-projects"] })
          }
        />
      )}

      {/* Create modal */}
      {createOpen && (
        <CreateProjectModal
          onClose={() => setCreateOpen(false)}
          onCreate={(data) => createMutation.mutate(data)}
          creating={createMutation.isPending}
        />
      )}
    </div>
  );
}

/* ─── Project Inspector ─── */
function ProjectInspector({
  projectId,
  onClose,
  onRefresh,
}: {
  projectId: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const qc = useQueryClient();
  const [assignWorkerId, setAssignWorkerId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditRating, setCreditRating] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  /* Project detail */
  const { data, isLoading, refetch } = useQuery<{
    success: boolean;
    project: Project;
    workerProfile?: Record<string, unknown>;
    proofs?: Array<Record<string, unknown>>;
  }>({
    queryKey: ["admin-project-detail", projectId],
    queryFn: () =>
      apiRequest(EP.ADMIN_WORKSPACE_PROJECT(projectId), "GET", undefined, true),
  });

  /* Eligible workers */
  const eligibleQuery = useQuery<{
    success: boolean;
    workers: EligibleWorker[];
    eligibilityInfo: { jobRole: string | null; requiresScreening: boolean };
  }>({
    queryKey: ["admin-project-eligible", projectId],
    queryFn: () =>
      apiRequest(
        EP.ADMIN_WORKSPACE_PROJECT_ELIGIBLE(projectId),
        "GET",
        undefined,
        true,
      ),
    enabled:
      data?.project?.status === "open" || data?.project?.status === "draft",
  });

  /* Assign mutation */
  const assignMutation = useMutation({
    mutationFn: (workerId: string) =>
      apiRequest(
        EP.ADMIN_WORKSPACE_PROJECT_ASSIGN(projectId),
        "PUT",
        { workerId },
        true,
      ),
    onSuccess: () => {
      showToast("Worker assigned to project", true);
      setAssignWorkerId("");
      refetch();
      onRefresh();
      qc.invalidateQueries({ queryKey: ["admin-workers"] });
    },
    onError: (e: Error) => showToast(e.message || "Assignment failed", false),
  });

  /* Credit mutation */
  const creditMutation = useMutation({
    mutationFn: (body: { amount: number; rating?: number }) =>
      apiRequest<Record<string, unknown>>(
        EP.ADMIN_WORKSPACE_PROJECT_CREDIT(projectId),
        "PUT",
        body,
        true,
      ),
    onSuccess: (res: Record<string, unknown>) => {
      showToast((res.message as string) || "Earnings credited", true);
      setCreditAmount("");
      setCreditRating("");
      refetch();
      onRefresh();
    },
    onError: (e: Error) => showToast(e.message || "Credit failed", false),
  });

  /* Complete mutation */
  const completeMutation = useMutation({
    mutationFn: () =>
      apiRequest(
        EP.ADMIN_WORKSPACE_PROJECT(projectId),
        "PUT",
        { status: "completed" },
        true,
      ),
    onSuccess: () => {
      showToast("Project marked completed", true);
      refetch();
      onRefresh();
    },
    onError: (e: Error) => showToast(e.message || "Failed", false),
  });

  if (isLoading || !data?.project) {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
        <div className="flex h-32 w-64 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  const p = data.project;
  const sc = PROJECT_STATUS_COLORS[p.status] ?? {
    bg: "bg-gray-500/15",
    text: "text-gray-400",
  };
  const worker =
    typeof p.assignedTo === "object" && p.assignedTo
      ? (p.assignedTo as unknown as Record<string, string>)
      : null;
  const pos =
    typeof p.workPositionId === "object" && p.workPositionId
      ? (p.workPositionId as unknown as Record<string, string>)
      : null;
  const eligible = eligibleQuery.data?.workers ?? [];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-6">
        {toast && (
          <div
            className={`mb-3 rounded-md px-3 py-2 text-xs font-medium ${toast.ok ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
          >
            {toast.msg}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{p.title}</h3>
            <span className="font-mono text-[10px] text-[var(--muted)]">
              ID: {p._id}
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

        {/* Status + meta */}
        <div className="mt-3 flex flex-wrap gap-4">
          <span
            className={`rounded px-2 py-1 text-xs font-semibold uppercase ${sc.bg} ${sc.text}`}
          >
            {p.status}
          </span>
          <span className="text-xs text-[var(--muted)]">
            Type: {p.projectType}
          </span>
          <span className="text-xs text-[var(--muted)]">
            Category: {p.category}
          </span>
          {pos && (
            <span className="text-xs text-[var(--muted)]">
              Role: {pos.title}
            </span>
          )}
        </div>

        {p.description && (
          <p className="mt-3 text-xs text-[var(--muted)]">{p.description}</p>
        )}

        {/* Metrics */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            {
              label: "Pay Rate",
              value: `$${p.payRate}`,
              color: "text-emerald-400",
            },
            { label: "Pay Type", value: p.payType, color: "text-white/80" },
            {
              label: "Est. Tasks",
              value: p.estimatedTasks,
              color: "text-blue-400",
            },
            {
              label: "Credited",
              value: `$${p.earningsCredited ?? 0}`,
              color: "text-amber-400",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded border border-[var(--border)] bg-black/20 px-3 py-2"
            >
              <div className={`text-sm font-bold tabular-nums ${m.color}`}>
                {m.value}
              </div>
              <div className="text-[10px] text-[var(--muted)]">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Assigned worker */}
        <div className="mt-4 rounded border border-[var(--border)] bg-black/20 p-3">
          <div className="mb-1 text-[10px] font-semibold uppercase text-[var(--muted)]">
            Assigned Worker
          </div>
          {worker ? (
            <div className="text-xs text-white/80">
              {worker.name ||
                `${worker.firstName ?? ""} ${worker.lastName ?? ""}`.trim()}{" "}
              ({worker.email})
            </div>
          ) : (
            <div className="text-xs text-[var(--muted)]">Not assigned</div>
          )}
        </div>

        {/* Assign worker (if project is open/draft) */}
        {(p.status === "open" || p.status === "draft") && (
          <div className="mt-4">
            <div className="mb-2 text-[10px] font-semibold uppercase text-[var(--muted)]">
              Assign Worker ({eligible.length} eligible)
            </div>
            {eligible.length > 0 ? (
              <div className="flex flex-col gap-2">
                <select
                  value={assignWorkerId}
                  onChange={(e) => setAssignWorkerId(e.target.value)}
                  className="rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="">Select worker...</option>
                  {eligible.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.userId.name || w.userId.email} — {w.workerStatus} — $
                      {w.totalEarnings} earned
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    assignWorkerId && assignMutation.mutate(assignWorkerId)
                  }
                  disabled={!assignWorkerId || assignMutation.isPending}
                  className="w-fit rounded bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {assignMutation.isPending ? "Assigning..." : "Assign Worker"}
                </button>
              </div>
            ) : (
              <div className="text-xs text-[var(--muted)]">
                {eligibleQuery.isLoading
                  ? "Loading eligible workers..."
                  : "No eligible workers found"}
              </div>
            )}
          </div>
        )}

        {/* Mark complete */}
        {(p.status === "in_progress" || p.status === "assigned") && (
          <div className="mt-4">
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="rounded bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {completeMutation.isPending ? "Completing..." : "Mark Complete"}
            </button>
          </div>
        )}

        {/* Credit earnings */}
        {p.status === "completed" && (p.earningsCredited ?? 0) === 0 && (
          <div className="mt-4">
            <div className="mb-2 text-[10px] font-semibold uppercase text-[var(--muted)]">
              Credit Earnings
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Amount ($)"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-32 rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="number"
                placeholder="Rating (1-5)"
                min={1}
                max={5}
                value={creditRating}
                onChange={(e) => setCreditRating(e.target.value)}
                className="w-28 rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
              />
              <button
                onClick={() =>
                  creditAmount &&
                  creditMutation.mutate({
                    amount: Number(creditAmount),
                    ...(creditRating ? { rating: Number(creditRating) } : {}),
                  })
                }
                disabled={!creditAmount || creditMutation.isPending}
                className="rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {creditMutation.isPending ? "Crediting..." : "Credit"}
              </button>
            </div>
          </div>
        )}

        {/* Deliverables */}
        {p.deliverables && p.deliverables.length > 0 && (
          <div className="mt-4">
            <div className="mb-1 text-[10px] font-semibold uppercase text-[var(--muted)]">
              Deliverables
            </div>
            <div className="flex flex-col gap-1">
              {p.deliverables.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${d.required ? "bg-red-400" : "bg-gray-400"}`}
                  />
                  <span className="text-white/80">{d.title}</span>
                  {d.description && (
                    <span className="text-[var(--muted)]">
                      — {d.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="mt-4 flex gap-4 text-[11px] text-[var(--muted)]">
          <span>Created: {new Date(p.createdAt).toLocaleDateString()}</span>
          {p.assignedAt && (
            <span>Assigned: {new Date(p.assignedAt).toLocaleDateString()}</span>
          )}
          {p.completedAt && (
            <span>
              Completed: {new Date(p.completedAt).toLocaleDateString()}
            </span>
          )}
          {p.deadline && (
            <span>Deadline: {new Date(p.deadline).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Create Project Modal ─── */
function CreateProjectModal({
  onClose,
  onCreate,
  creating,
}: {
  onClose: () => void;
  onCreate: (data: Record<string, unknown>) => void;
  creating: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("microjobs");
  const [payRate, setPayRate] = useState("0");
  const [payType, setPayType] = useState<"per_task" | "hourly" | "fixed">(
    "per_task",
  );
  const [estimatedTasks, setEstimatedTasks] = useState("1");
  const [deadline, setDeadline] = useState("");
  const [projectType, setProjectType] = useState<"standard" | "rlhf_dataset">(
    "standard",
  );

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Create Project</h3>
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

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
            >
              {[
                "microjobs",
                "writing",
                "teaching",
                "coding_math",
                "outlier",
                "other",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Type
            </label>
            <select
              value={projectType}
              onChange={(e) =>
                setProjectType(e.target.value as "standard" | "rlhf_dataset")
              }
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
            >
              <option value="standard">Standard</option>
              <option value="rlhf_dataset">RLHF Dataset</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Pay Rate
            </label>
            <input
              type="number"
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Pay Type
            </label>
            <select
              value={payType}
              onChange={(e) =>
                setPayType(e.target.value as "per_task" | "hourly" | "fixed")
              }
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
            >
              <option value="per_task">Per Task</option>
              <option value="hourly">Hourly</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Est. Tasks
            </label>
            <input
              type="number"
              value={estimatedTasks}
              onChange={(e) => setEstimatedTasks(e.target.value)}
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={() =>
              title &&
              onCreate({
                title,
                description,
                category,
                payRate: Number(payRate),
                payType,
                estimatedTasks: Number(estimatedTasks),
                projectType,
                ...(deadline ? { deadline } : {}),
              })
            }
            disabled={!title || creating}
            className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Project"}
          </button>
          <button
            onClick={onClose}
            className="rounded border border-[var(--border)] px-4 py-2 text-xs text-[var(--muted)] hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
