"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import {
  MetricsRibbon,
  DataGrid,
  Badge,
  ConfirmModal,
  StateVisualizer,
  type Column,
} from "@/design-system";
import { emitToast } from "@/hooks/useToast";

type Tab = "workers" | "screenings" | "projects" | "jobs";

export default function WorkforceEngine() {
  const [tab, setTab] = useState<Tab>("workers");
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    msg: string;
    fn: () => Promise<unknown>;
  } | null>(null);

  /* ─── Inspector ─── */
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [inspectTab, setInspectTab] = useState<Tab>("workers");

  /* ─── Worker status form ─── */
  const [statusForm, setStatusForm] = useState({ workerId: "", status: "" });
  const [assignForm, setAssignForm] = useState({ projectId: "", workerId: "" });

  /* ─── QUERIES ─── */
  const { data: workersData, isLoading: workersLoading } = useQuery({
    queryKey: ["admin-workers"],
    queryFn: () =>
      apiRequest<{ workers: Record<string, unknown>[] }>(
        EP.ADMIN_WORKSPACE_WORKERS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "workers",
  });

  const { data: qualifiedCount } = useQuery({
    queryKey: ["admin-workers-qualified"],
    queryFn: () =>
      apiRequest<{ count: number }>(
        EP.ADMIN_WORKSPACE_WORKERS_QUALIFIED,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "workers",
  });

  const { data: screeningsData, isLoading: screeningsLoading } = useQuery({
    queryKey: ["admin-screenings"],
    queryFn: () =>
      apiRequest<{ screenings: Record<string, unknown>[] }>(
        EP.ADMIN_WORKSPACE_SCREENINGS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "screenings",
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () =>
      apiRequest<{ projects: Record<string, unknown>[] }>(
        EP.ADMIN_WORKSPACE_PROJECTS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "projects",
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: () =>
      apiRequest<{ jobs: Record<string, unknown>[] }>(
        EP.ADMIN_WORKSPACE_JOBS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "jobs",
  });

  const { data: submissionsData } = useQuery({
    queryKey: ["admin-screening-submissions"],
    queryFn: () =>
      apiRequest<{ submissions: Record<string, unknown>[] }>(
        EP.ADMIN_WORKSPACE_SCREENING_SUBMISSIONS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "screenings",
  });

  /* ─── Inspector queries ─── */
  const { data: inspectedWorker } = useQuery({
    queryKey: ["admin-worker", inspectId],
    queryFn: () =>
      apiRequest<{ worker: Record<string, unknown> }>(
        EP.ADMIN_WORKSPACE_WORKER(inspectId!),
        "GET",
        undefined,
        true,
      ),
    enabled: !!inspectId && inspectTab === "workers",
  });

  const { data: inspectedJob } = useQuery({
    queryKey: ["admin-job", inspectId],
    queryFn: () =>
      apiRequest<{ job: Record<string, unknown> }>(
        EP.ADMIN_WORKSPACE_JOB(inspectId!),
        "GET",
        undefined,
        true,
      ),
    enabled: !!inspectId && inspectTab === "jobs",
  });

  /* ─── MUTATIONS ─── */
  const actionMut = useMutation({
    mutationFn: async ({
      url,
      method,
      body,
    }: {
      url: string;
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: unknown;
    }) => apiRequest(url, method, body, true),
    onSuccess: () => {
      emitToast("Action completed", "success");
      queryClient.invalidateQueries({ queryKey: ["admin-workers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-screenings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-screening-submissions"],
      });
      setConfirmAction(null);
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  /* ─── METRICS ─── */
  const metrics = [
    { label: "Workers", value: workersData?.workers?.length ?? "—" },
    {
      label: "Qualified",
      value: qualifiedCount?.count ?? 0,
      color: "var(--color-success)",
    },
    { label: "Screenings", value: screeningsData?.screenings?.length ?? "—" },
    { label: "Projects", value: projectsData?.projects?.length ?? "—" },
    { label: "Jobs", value: jobsData?.jobs?.length ?? "—" },
  ];

  /* ─── COLUMNS ─── */
  const workerCols: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (r) => {
        const u = r.userId as Record<string, unknown> | undefined;
        return u?.name ? String(u.name) : "—";
      },
    },
    {
      key: "workerStatus",
      header: "Status",
      render: (r) => <Badge status={String(r.workerStatus)} />,
    },
    { key: "category", header: "Category" },
    { key: "tier", header: "Tier" },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button
          className="u-btn u-btn-ghost u-btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            setInspectId(String(r._id));
            setInspectTab("workers");
          }}
        >
          👁
        </button>
      ),
    },
  ];

  const screeningCols: Column<Record<string, unknown>>[] = [
    { key: "title", header: "Title", sortable: true },
    {
      key: "type",
      header: "Type",
      render: (r) => <Badge status={String(r.type)} />,
    },
    { key: "category", header: "Category" },
    {
      key: "questionsCount",
      header: "Questions",
      render: (r) => {
        const q = r.questions as unknown[] | undefined;
        return q?.length ?? 0;
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button
          className="u-btn u-btn-secondary u-btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmAction({
              title: "Clone Screening",
              msg: `Clone "${r.title}"?`,
              fn: () =>
                actionMut.mutateAsync({
                  url: EP.ADMIN_WORKSPACE_SCREENING_CLONE(String(r._id)),
                  method: "POST",
                }),
            });
          }}
        >
          Clone
        </button>
      ),
    },
  ];

  const projectCols: Column<Record<string, unknown>>[] = [
    { key: "title", header: "Title", sortable: true },
    { key: "category", header: "Category" },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge status={String(r.status)} />,
    },
    { key: "type", header: "Type" },
    {
      key: "payRate",
      header: "Pay Rate",
      render: (r) => `$${Number(r.payRate || 0).toFixed(2)}`,
    },
  ];

  const jobCols: Column<Record<string, unknown>>[] = [
    { key: "title", header: "Title", sortable: true },
    { key: "category", header: "Category" },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge status={String(r.status || "draft")} />,
    },
    {
      key: "applicantsCount",
      header: "Applicants",
      render: (r) => {
        const a = r.applicants as unknown[] | undefined;
        return a?.length ?? 0;
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          <button
            className="u-btn u-btn-ghost u-btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setInspectId(String(r._id));
              setInspectTab("jobs");
            }}
          >
            👁
          </button>
          <button
            className="u-btn u-btn-primary u-btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmAction({
                title: "Approve Job",
                msg: `Approve "${r.title}"?`,
                fn: () =>
                  actionMut.mutateAsync({
                    url: EP.ADMIN_WORKSPACE_JOB_APPROVE(String(r._id)),
                    method: "PUT",
                  }),
              });
            }}
          >
            ✓
          </button>
        </div>
      ),
    },
  ];

  const submissionCols: Column<Record<string, unknown>>[] = [
    {
      key: "worker",
      header: "Worker",
      render: (r) => {
        const w = r.workerId as Record<string, unknown> | undefined;
        return w?.name ? String(w.name) : String(r.workerId || "—");
      },
    },
    {
      key: "screening",
      header: "Screening",
      render: (r) => {
        const s = r.screeningId as Record<string, unknown> | undefined;
        return s?.title ? String(s.title) : String(r.screeningId || "—");
      },
    },
    { key: "score", header: "Score" },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge status={String(r.status || "pending")} />,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          <button
            className="u-btn u-btn-primary u-btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmAction({
                title: "Pass",
                msg: "Pass this submission?",
                fn: () =>
                  actionMut.mutateAsync({
                    url: EP.ADMIN_WORKSPACE_SCREENING_REVIEW(String(r._id)),
                    method: "PUT",
                    body: { result: "pass" },
                  }),
              });
            }}
          >
            Pass
          </button>
          <button
            className="u-btn u-btn-danger u-btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmAction({
                title: "Fail",
                msg: "Fail this submission?",
                fn: () =>
                  actionMut.mutateAsync({
                    url: EP.ADMIN_WORKSPACE_SCREENING_REVIEW(String(r._id)),
                    method: "PUT",
                    body: { result: "fail" },
                  }),
              });
            }}
          >
            Fail
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "var(--space-5)" }}>
      <h1 className="u-heading-1" style={{ marginBottom: "var(--space-4)" }}>
        Workforce Engine
      </h1>

      <MetricsRibbon metrics={metrics} loading={workersLoading} />

      <div className="tab-bar" style={{ marginTop: "var(--space-4)" }}>
        {(["workers", "screenings", "projects", "jobs"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab-bar-item ${tab === t ? "tab-bar-item--active" : ""}`}
            onClick={() => {
              setTab(t);
              setInspectId(null);
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          marginTop: "var(--space-4)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === "workers" && (
            <>
              <DataGrid
                columns={workerCols}
                data={(workersData?.workers ?? []) as Record<string, unknown>[]}
                loading={workersLoading}
                rowKey={(r) => String(r._id)}
                onRowClick={(r) => {
                  setInspectId(String(r._id));
                  setInspectTab("workers");
                }}
              />

              {/* Assign Task Form */}
              <div
                className="u-card"
                style={{ marginTop: "var(--space-4)", maxWidth: 500 }}
              >
                <h3
                  className="u-heading-3"
                  style={{ marginBottom: "var(--space-3)" }}
                >
                  Assign Task to Worker
                </h3>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  <input
                    className="u-input"
                    placeholder="Worker ID"
                    value={assignForm.workerId}
                    onChange={(e) =>
                      setAssignForm((f) => ({ ...f, workerId: e.target.value }))
                    }
                  />
                  <input
                    className="u-input"
                    placeholder="Project ID"
                    value={assignForm.projectId}
                    onChange={(e) =>
                      setAssignForm((f) => ({
                        ...f,
                        projectId: e.target.value,
                      }))
                    }
                  />
                  <button
                    className="u-btn u-btn-primary"
                    disabled={!assignForm.workerId || !assignForm.projectId}
                    onClick={() =>
                      setConfirmAction({
                        title: "Assign Task",
                        msg: "Assign this project to the worker?",
                        fn: () =>
                          actionMut.mutateAsync({
                            url: EP.ADMIN_WORKSPACE_WORKER_ASSIGN(
                              assignForm.workerId,
                            ),
                            method: "POST",
                            body: { projectId: assignForm.projectId },
                          }),
                      })
                    }
                  >
                    Assign
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === "screenings" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-5)",
              }}
            >
              <DataGrid
                columns={screeningCols}
                data={
                  (screeningsData?.screenings ?? []) as Record<
                    string,
                    unknown
                  >[]
                }
                loading={screeningsLoading}
                rowKey={(r) => String(r._id)}
              />
              <div>
                <h3
                  className="u-heading-3"
                  style={{ marginBottom: "var(--space-3)" }}
                >
                  Screening Submissions
                </h3>
                <DataGrid
                  columns={submissionCols}
                  data={
                    (submissionsData?.submissions ?? []) as Record<
                      string,
                      unknown
                    >[]
                  }
                  emptyMessage="No pending submissions"
                  rowKey={(r) => String(r._id)}
                />
              </div>
            </div>
          )}

          {tab === "projects" && (
            <DataGrid
              columns={projectCols}
              data={(projectsData?.projects ?? []) as Record<string, unknown>[]}
              loading={projectsLoading}
              rowKey={(r) => String(r._id)}
            />
          )}

          {tab === "jobs" && (
            <DataGrid
              columns={jobCols}
              data={(jobsData?.jobs ?? []) as Record<string, unknown>[]}
              loading={jobsLoading}
              rowKey={(r) => String(r._id)}
              onRowClick={(r) => {
                setInspectId(String(r._id));
                setInspectTab("jobs");
              }}
            />
          )}
        </div>

        {/* Inspector Panel */}
        {inspectId && (
          <aside style={inspectorStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-4)",
              }}
            >
              <h3 className="u-heading-3">
                {inspectTab === "workers" ? "Worker" : "Job"} Detail
              </h3>
              <button
                className="u-btn u-btn-ghost u-btn-sm"
                onClick={() => setInspectId(null)}
              >
                ✕
              </button>
            </div>

            {inspectTab === "workers" && inspectedWorker?.worker && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                <StateVisualizer
                  entity="worker"
                  currentState={String(inspectedWorker.worker.workerStatus)}
                  compact
                />
                <InspectorRow
                  label="Category"
                  value={String(inspectedWorker.worker.category || "—")}
                />
                <InspectorRow
                  label="Tier"
                  value={String(inspectedWorker.worker.tier || "—")}
                />

                {/* Status transition */}
                <div
                  className="auth-field"
                  style={{ marginTop: "var(--space-3)" }}
                >
                  <label className="u-label">Set Status</label>
                  <select
                    className="u-input"
                    value={statusForm.status}
                    onChange={(e) =>
                      setStatusForm({
                        workerId: inspectId!,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="">Select status</option>
                    {[
                      "applied",
                      "screening",
                      "in_training",
                      "trained",
                      "ready",
                      "active",
                      "paused",
                      "blocked",
                      "terminated",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <button
                    className="u-btn u-btn-primary u-btn-sm"
                    style={{ marginTop: "var(--space-2)" }}
                    disabled={!statusForm.status}
                    onClick={() =>
                      setConfirmAction({
                        title: "Update Worker Status",
                        msg: `Set worker status to "${statusForm.status}"?`,
                        fn: () =>
                          actionMut.mutateAsync({
                            url: EP.ADMIN_WORKSPACE_WORKER_STATUS(inspectId!),
                            method: "PUT",
                            body: { workerStatus: statusForm.status },
                          }),
                      })
                    }
                  >
                    Update Status
                  </button>
                </div>
              </div>
            )}

            {inspectTab === "jobs" && inspectedJob?.job && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                <InspectorRow
                  label="Title"
                  value={String(inspectedJob.job.title)}
                />
                <InspectorRow
                  label="Category"
                  value={String(inspectedJob.job.category || "—")}
                />
                <InspectorRow
                  label="Status"
                  value={
                    <Badge
                      status={String(inspectedJob.job.status || "draft")}
                    />
                  }
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                    marginTop: "var(--space-3)",
                  }}
                >
                  <button
                    className="u-btn u-btn-primary u-btn-sm"
                    onClick={() =>
                      setConfirmAction({
                        title: "Approve Job",
                        msg: "Approve?",
                        fn: () =>
                          actionMut.mutateAsync({
                            url: EP.ADMIN_WORKSPACE_JOB_APPROVE(inspectId!),
                            method: "PUT",
                          }),
                      })
                    }
                  >
                    Approve
                  </button>
                  <button
                    className="u-btn u-btn-danger u-btn-sm"
                    onClick={() =>
                      setConfirmAction({
                        title: "Reject Job",
                        msg: "Reject?",
                        fn: () =>
                          actionMut.mutateAsync({
                            url: EP.ADMIN_WORKSPACE_JOB_REJECT(inspectId!),
                            method: "PUT",
                          }),
                      })
                    }
                  >
                    Reject
                  </button>
                  <button
                    className="u-btn u-btn-secondary u-btn-sm"
                    onClick={() =>
                      setConfirmAction({
                        title: "Unlock Screening",
                        msg: "Unlock screening for this job?",
                        fn: () =>
                          actionMut.mutateAsync({
                            url: EP.ADMIN_WORKSPACE_JOB_UNLOCK_SCREENING(
                              inspectId!,
                            ),
                            method: "PUT",
                          }),
                      })
                    }
                  >
                    Unlock Screening
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title ?? ""}
        message={confirmAction?.msg ?? ""}
        onConfirm={() => confirmAction?.fn() ?? Promise.resolve()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

function InspectorRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-tertiary)",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "var(--text-sm)" }}>{value}</div>
    </div>
  );
}

const inspectorStyle: React.CSSProperties = {
  width: 340,
  flexShrink: 0,
  borderLeft: "1px solid var(--color-border)",
  background: "var(--color-bg-secondary)",
  padding: "var(--space-4)",
  overflowY: "auto",
  maxHeight: "calc(100vh - 180px)",
  borderRadius: "var(--radius-lg)",
};
