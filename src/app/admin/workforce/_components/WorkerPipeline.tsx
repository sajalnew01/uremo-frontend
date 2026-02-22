"use client";

import { useMemo } from "react";
import type { ApplyWork, WorkerStatus } from "@/types";
import {
  PIPELINE_COLUMNS,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/workforce-state-machine";

interface Props {
  workers: ApplyWork[];
  isLoading: boolean;
  onSelectWorker: (id: string) => void;
  statusFilter: string;
  onStatusFilter: (s: string) => void;
  counts: {
    pending: number;
    waitingScreening: number;
    readyToWork: number;
    active: number;
    total: number;
  };
}

export function WorkerPipeline({
  workers,
  isLoading,
  onSelectWorker,
  statusFilter,
  onStatusFilter,
  counts,
}: Props) {
  /* Group workers by workerStatus into pipeline columns */
  const grouped = useMemo(() => {
    const map: Record<string, ApplyWork[]> = {};
    for (const col of PIPELINE_COLUMNS) map[col] = [];
    for (const w of workers) {
      const s = w.workerStatus;
      if (map[s]) map[s].push(w);
      else {
        /* unknown status — attach to first column */
        if (!map["_other"]) map["_other"] = [];
        map["_other"].push(w);
      }
    }
    return map;
  }, [workers]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span className="ml-3 text-sm text-[var(--muted)]">
          Loading worker pipeline...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          Filter
        </span>
        <button
          onClick={() => onStatusFilter("")}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
            !statusFilter
              ? "bg-blue-500/20 text-blue-400"
              : "text-[var(--muted)] hover:text-white"
          }`}
        >
          All ({counts.total})
        </button>
        {PIPELINE_COLUMNS.map((col) => {
          const c = STATUS_COLORS[col] ?? {
            bg: "bg-gray-500/15",
            text: "text-gray-400",
          };
          const count = grouped[col]?.length ?? 0;
          return (
            <button
              key={col}
              onClick={() => onStatusFilter(statusFilter === col ? "" : col)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                statusFilter === col
                  ? `${c.bg} ${c.text}`
                  : "text-[var(--muted)] hover:text-white"
              }`}
            >
              {STATUS_LABELS[col] ?? col} ({count})
            </button>
          );
        })}
      </div>

      {/* Kanban pipeline */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_COLUMNS.filter(
          (col) => !statusFilter || statusFilter === col,
        ).map((col) => {
          const c = STATUS_COLORS[col] ?? {
            bg: "bg-gray-500/15",
            text: "text-gray-400",
          };
          const colWorkers = grouped[col] ?? [];
          return (
            <div
              key={col}
              className="flex w-64 min-w-[256px] flex-shrink-0 flex-col rounded-lg border border-[var(--border)] bg-[var(--panel)]"
            >
              {/* Column header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${c.bg.replace("/15", "")}`}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {STATUS_LABELS[col] ?? col}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${c.bg} ${c.text}`}
                >
                  {colWorkers.length}
                </span>
              </div>

              {/* Cards */}
              <div
                className="flex flex-col gap-2 overflow-y-auto p-2"
                style={{ maxHeight: "60vh" }}
              >
                {colWorkers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[var(--muted)]">
                    No workers
                  </div>
                ) : (
                  colWorkers.map((w) => (
                    <WorkerCard
                      key={w._id}
                      worker={w}
                      onClick={() => onSelectWorker(w._id)}
                      statusColor={c}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Worker Card ─── */
function WorkerCard({
  worker,
  onClick,
  statusColor,
}: {
  worker: ApplyWork;
  onClick: () => void;
  statusColor: { bg: string; text: string; glow?: string };
}) {
  const user = typeof worker.user === "object" ? worker.user : null;
  const pos = typeof worker.position === "object" ? worker.position : null;
  const userRec = user as unknown as Record<string, string> | null;
  const name =
    user?.name || userRec?.firstName
      ? `${userRec?.firstName ?? ""} ${userRec?.lastName ?? ""}`.trim() ||
        user?.name
      : worker.positionTitle || "Unknown";

  const screeningScore =
    worker.screeningsCompleted?.length > 0
      ? worker.screeningsCompleted[worker.screeningsCompleted.length - 1].score
      : null;

  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-md border border-[var(--border)] bg-black/20 p-3 text-left transition-all hover:border-white/20 hover:bg-white/5 ${statusColor.glow ?? ""}`}
    >
      {/* Name */}
      <div className="text-sm font-medium leading-tight text-white/90 group-hover:text-white">
        {name}
      </div>

      {/* Position */}
      <div className="mt-1 text-[11px] text-[var(--muted)]">
        {worker.positionTitle || pos?.title || "—"}
      </div>

      {/* Badges row */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {/* Status chip */}
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColor.bg} ${statusColor.text}`}
        >
          {STATUS_LABELS[worker.workerStatus] ?? worker.workerStatus}
        </span>

        {/* Screening score */}
        {screeningScore !== null && (
          <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">
            Score: {screeningScore}
          </span>
        )}

        {/* Tier */}
        {worker.tier && worker.tier !== "bronze" && (
          <span className="rounded bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
            {worker.tier}
          </span>
        )}
      </div>

      {/* Earnings */}
      {(worker.totalEarnings ?? 0) > 0 && (
        <div className="mt-2 text-[10px] tabular-nums text-emerald-400/80">
          ${worker.totalEarnings.toFixed(2)} earned
        </div>
      )}

      {/* ID */}
      <div className="mt-1 font-mono text-[9px] text-[var(--muted)] opacity-50">
        {worker._id.slice(-8)}
      </div>
    </button>
  );
}
