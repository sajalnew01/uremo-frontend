"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { ApplyWork, WorkerStatus } from "@/types";
import {
  getAllowedTransitions,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/workforce-state-machine";

interface Props {
  workerId: string;
  onClose: () => void;
  onRefresh: () => void;
}

interface WorkerDetail extends ApplyWork {
  projects?: Array<Record<string, unknown>>;
  allApplications?: Array<Record<string, unknown>>;
  activityLog?: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export function WorkerInspector({ workerId, onClose, onRefresh }: Props) {
  const qc = useQueryClient();
  const [transitionTarget, setTransitionTarget] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");
  const [payRate, setPayRate] = useState<string>("");
  const [taskDesc, setTaskDesc] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  /* ─── Worker detail query ─── */
  const { data, isLoading, refetch } = useQuery<{ worker: WorkerDetail }>({
    queryKey: ["admin-worker-detail", workerId],
    queryFn: () =>
      apiRequest(
        `${EP.ADMIN_WORKSPACE_WORKER(workerId)}`,
        "GET",
        undefined,
        true,
      ),
  });

  const worker = data?.worker;

  /* ─── Status transition mutation ─── */
  const statusMutation = useMutation({
    mutationFn: async (body: {
      workerStatus: string;
      payRate?: number;
      adminNotes?: string;
    }) =>
      apiRequest<Record<string, unknown>>(
        EP.ADMIN_WORKSPACE_WORKER_STATUS(workerId),
        "PUT",
        body,
        true,
      ),
    onSuccess: (res: Record<string, unknown>) => {
      showToast(`Status updated to ${transitionTarget}`, true);
      setTransitionTarget("");
      refetch();
      onRefresh();
      qc.invalidateQueries({ queryKey: ["admin-workers"] });
    },
    onError: (err: Error & { message?: string }) => {
      showToast(err.message || "Transition failed", false);
    },
  });

  /* ─── Assign task mutation ─── */
  const taskMutation = useMutation({
    mutationFn: async (body: { taskDescription: string }) =>
      apiRequest(
        EP.ADMIN_WORKSPACE_WORKER_ASSIGN(workerId),
        "POST",
        body,
        true,
      ),
    onSuccess: () => {
      showToast("Task assigned", true);
      setTaskDesc("");
      refetch();
    },
    onError: (err: Error) => {
      showToast(err.message || "Task assignment failed", false);
    },
  });

  const handleTransition = () => {
    if (!transitionTarget) return;
    const body: Record<string, unknown> = { workerStatus: transitionTarget };
    if (adminNotes) body.adminNotes = adminNotes;
    if (payRate) body.payRate = Number(payRate);
    statusMutation.mutate(
      body as { workerStatus: string; payRate?: number; adminNotes?: string },
    );
  };

  if (isLoading || !worker) {
    return (
      <div className="absolute inset-y-0 right-0 z-50 flex w-[480px] items-center justify-center border-l border-[var(--border)] bg-[var(--bg)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const user =
    typeof worker.user === "object"
      ? (worker.user as unknown as Record<string, string>)
      : null;
  const pos =
    typeof worker.position === "object"
      ? (worker.position as unknown as Record<string, unknown>)
      : null;
  const allowed = getAllowedTransitions(worker.workerStatus);
  const sc = STATUS_COLORS[worker.workerStatus] ?? {
    bg: "bg-gray-500/15",
    text: "text-gray-400",
  };

  return (
    <div className="absolute inset-y-0 right-0 z-50 flex w-[480px] flex-col border-l border-[var(--border)] bg-[var(--bg)] shadow-2xl">
      {/* Toast */}
      {toast && (
        <div
          className={`mx-4 mt-2 rounded-md px-3 py-2 text-xs font-medium ${
            toast.ok
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">Worker Inspector</h2>
          <span className="font-mono text-[10px] text-[var(--muted)]">
            ID: {worker._id}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-[var(--muted)] transition-colors hover:bg-white/10 hover:text-white"
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Identity */}
        <div className="border-b border-[var(--border)] px-5 py-4">
          <div className="text-base font-medium">
            {user?.name || user?.firstName
              ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
              : "—"}
          </div>
          <div className="mt-0.5 text-xs text-[var(--muted)]">
            {user?.email ?? "—"}
          </div>
          <div className="mt-2 text-xs text-[var(--muted)]">
            Position:{" "}
            <span className="text-white/80">
              {worker.positionTitle || (pos?.title as string) || "—"}
            </span>
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            Category:{" "}
            <span className="text-white/80">{worker.category || "—"}</span>
          </div>
        </div>

        {/* Current Status */}
        <div className="border-b border-[var(--border)] px-5 py-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Current Status
          </div>
          <span
            className={`inline-block rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide ${sc.bg} ${sc.text} ${STATUS_COLORS[worker.workerStatus]?.glow ?? ""}`}
          >
            {STATUS_LABELS[worker.workerStatus] ?? worker.workerStatus}
          </span>
        </div>

        {/* State Machine Transitions */}
        <div className="border-b border-[var(--border)] px-5 py-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Allowed Transitions
          </div>
          {allowed.length === 0 ? (
            <div className="text-xs text-[var(--muted)]">
              No transitions available from this state
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {allowed.map((target) => {
                  const tc = STATUS_COLORS[target] ?? {
                    bg: "bg-gray-500/15",
                    text: "text-gray-400",
                  };
                  return (
                    <button
                      key={target}
                      onClick={() => setTransitionTarget(target)}
                      disabled={statusMutation.isPending}
                      className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                        transitionTarget === target
                          ? `${tc.bg} ${tc.text} ring-1 ring-current`
                          : `${tc.bg} ${tc.text} opacity-60 hover:opacity-100`
                      }`}
                    >
                      {STATUS_LABELS[target] ?? target}
                    </button>
                  );
                })}
              </div>

              {transitionTarget && (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="text-[11px] text-[var(--muted)]">
                    Transition:{" "}
                    <span className="text-white/80">{worker.workerStatus}</span>
                    {" -> "}
                    <span className="text-white/80">{transitionTarget}</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Admin notes (optional)"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white placeholder:text-[var(--muted)]"
                  />
                  <input
                    type="number"
                    placeholder="Pay rate override (optional)"
                    value={payRate}
                    onChange={(e) => setPayRate(e.target.value)}
                    className="rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white placeholder:text-[var(--muted)]"
                  />
                  <button
                    onClick={handleTransition}
                    disabled={statusMutation.isPending}
                    className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                  >
                    {statusMutation.isPending
                      ? "Updating..."
                      : "Apply Transition"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Metrics */}
        <div className="border-b border-[var(--border)] px-5 py-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Metrics
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Total Earnings",
                value: `$${(worker.totalEarnings ?? 0).toFixed(2)}`,
                color: "text-emerald-400",
              },
              {
                label: "Pending Earnings",
                value: `$${(worker.pendingEarnings ?? 0).toFixed(2)}`,
                color: "text-amber-400",
              },
              {
                label: "Quality Score",
                value: `${worker.qualityScore ?? 0}/100`,
                color: "text-blue-400",
              },
              {
                label: "Tier",
                value: worker.tier ?? "bronze",
                color: "text-yellow-400",
              },
              {
                label: "RLHF Score",
                value: `${(worker.rlhfScore ?? 0).toFixed(1)}`,
                color: "text-purple-400",
              },
              {
                label: "Annotations",
                value: `${worker.totalAnnotations ?? 0}`,
                color: "text-cyan-400",
              },
              {
                label: "Pay Rate",
                value: `$${(worker.payRate ?? 0).toFixed(2)}`,
                color: "text-emerald-400",
              },
              {
                label: "Attempts",
                value: `${worker.attemptCount ?? 0}/${worker.maxAttempts ?? 2}`,
                color: "text-white/80",
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
        </div>

        {/* Screening History */}
        {(worker.screeningsCompleted?.length ?? 0) > 0 && (
          <div className="border-b border-[var(--border)] px-5 py-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Screening History
            </div>
            <div className="flex flex-col gap-2">
              {worker.screeningsCompleted.map((sc, i) => (
                <div
                  key={`${sc.screeningId}-${i}`}
                  className="rounded border border-[var(--border)] bg-black/20 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[var(--muted)]">
                      {sc.screeningId?.toString().slice(-8)}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        sc.submissionStatus === "approved"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : sc.submissionStatus === "rejected"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {sc.submissionStatus}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span className="text-[var(--muted)]">
                      Score: <span className="text-white/80">{sc.score}</span>
                    </span>
                    {sc.autoScore != null && (
                      <span className="text-[var(--muted)]">
                        Auto:{" "}
                        <span className="text-white/80">{sc.autoScore}</span>
                      </span>
                    )}
                    <span
                      className={
                        sc.passed ? "text-emerald-400" : "text-red-400"
                      }
                    >
                      {sc.passed ? "PASSED" : "FAILED"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Log */}
        {(worker.activityLog?.length ?? 0) > 0 && (
          <div className="border-b border-[var(--border)] px-5 py-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Activity Log
            </div>
            <div className="flex flex-col gap-1.5">
              {worker.activityLog?.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400/60" />
                  <div>
                    <span className="text-white/80">{entry.description}</span>
                    <span className="ml-2 text-[10px] text-[var(--muted)]">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assigned Tasks */}
        {(worker.assignedTasks?.length ?? 0) > 0 && (
          <div className="border-b border-[var(--border)] px-5 py-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Assigned Tasks
            </div>
            <div className="flex flex-col gap-1.5">
              {worker.assignedTasks.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between rounded border border-[var(--border)] bg-black/20 px-3 py-2"
                >
                  <span className="text-xs text-white/80">{t.description}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      t.status === "completed"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : t.status === "in-progress"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-gray-500/15 text-gray-400"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assign New Task */}
        <div className="px-5 py-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Assign Task
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Task description..."
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              className="flex-1 rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white placeholder:text-[var(--muted)]"
            />
            <button
              onClick={() =>
                taskDesc && taskMutation.mutate({ taskDescription: taskDesc })
              }
              disabled={!taskDesc || taskMutation.isPending}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {taskMutation.isPending ? "..." : "Assign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
