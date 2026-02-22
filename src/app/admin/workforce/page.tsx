"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRequireAdmin } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { ApplyWork } from "@/types";
import { WorkerPipeline } from "./_components/WorkerPipeline";
import { WorkerInspector } from "./_components/WorkerInspector";
import { ScreeningsTab } from "./_components/ScreeningsTab";
import { ProjectsTab } from "./_components/ProjectsTab";
import { JobRolesTab } from "./_components/JobRolesTab";

/* ─── Tab Definitions ─── */
const TABS = [
  { key: "pipeline", label: "Worker Pipeline" },
  { key: "screenings", label: "Screenings" },
  { key: "projects", label: "Projects" },
  { key: "jobroles", label: "Job Roles" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

/* ─── Workers API response ─── */
interface WorkersResponse {
  workers: ApplyWork[];
  total: number;
  page: number;
  pages: number;
  pendingCount: number;
  waitingScreeningCount: number;
  readyToWorkCount: number;
  activeCount: number;
}

export default function AdminWorkforcePage() {
  const ok = useRequireAdmin();
  const [activeTab, setActiveTab] = useState<TabKey>("pipeline");
  const [inspectedWorker, setInspectedWorker] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  /* ─── Workers Query ─── */
  const workersQuery = useQuery<WorkersResponse>({
    queryKey: ["admin-workers", statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("workerStatus", statusFilter);
      params.set("page", String(page));
      params.set("limit", "100");
      const qs = params.toString();
      const res = await apiRequest<WorkersResponse>(
        `${EP.ADMIN_WORKSPACE_WORKERS}?${qs}`,
        "GET",
        undefined,
        true,
      );
      return res;
    },
    enabled: !!ok,
    refetchInterval: 30000,
  });

  /* ─── Qualified Counts ─── */
  const qualifiedQuery = useQuery<{
    qualifiedCounts: Record<string, number>;
    total: number;
  }>({
    queryKey: ["admin-qualified-counts"],
    queryFn: () =>
      apiRequest(
        `${EP.ADMIN_WORKSPACE_WORKERS_QUALIFIED}`,
        "GET",
        undefined,
        true,
      ),
    enabled: !!ok,
  });

  const openInspector = useCallback((id: string) => setInspectedWorker(id), []);
  const closeInspector = useCallback(() => setInspectedWorker(null), []);

  if (!ok) return null;

  const workers = workersQuery.data?.workers ?? [];
  const counts = {
    pending: workersQuery.data?.pendingCount ?? 0,
    waitingScreening: workersQuery.data?.waitingScreeningCount ?? 0,
    readyToWork: workersQuery.data?.readyToWorkCount ?? 0,
    active: workersQuery.data?.activeCount ?? 0,
    total: workersQuery.data?.total ?? 0,
  };

  return (
    <div className="flex h-full flex-col gap-0">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            AI Operations Control Center
          </h1>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Workforce lifecycle orchestration
          </p>
        </div>
        <div className="flex items-center gap-4">
          {[
            {
              label: "Total Workers",
              value: counts.total,
              color: "text-blue-400",
            },
            {
              label: "Ready",
              value: counts.readyToWork,
              color: "text-emerald-400",
            },
            { label: "Active", value: counts.active, color: "text-green-400" },
            {
              label: "Qualified",
              value: qualifiedQuery.data?.total ?? 0,
              color: "text-cyan-400",
            },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className={`text-base font-bold tabular-nums ${s.color}`}>
                {s.value}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] bg-[var(--panel)] px-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-white"
                : "text-[var(--muted)] hover:text-white/80"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative flex-1 overflow-hidden">
        <div className="h-full overflow-auto p-6">
          {activeTab === "pipeline" && (
            <WorkerPipeline
              workers={workers}
              isLoading={workersQuery.isLoading}
              onSelectWorker={openInspector}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
              counts={counts}
            />
          )}
          {activeTab === "screenings" && <ScreeningsTab />}
          {activeTab === "projects" && <ProjectsTab />}
          {activeTab === "jobroles" && <JobRolesTab />}
        </div>

        {/* Inspector Slide Panel */}
        {inspectedWorker && (
          <WorkerInspector
            workerId={inspectedWorker}
            onClose={closeInspector}
            onRefresh={() => workersQuery.refetch()}
          />
        )}
      </div>
    </div>
  );
}
