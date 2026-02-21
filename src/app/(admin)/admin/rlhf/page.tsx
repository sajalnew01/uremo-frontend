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
  type Column,
} from "@/design-system";
import { emitToast } from "@/hooks/useToast";

type Tab = "datasets" | "submissions";

export default function RlhfEngine() {
  const [tab, setTab] = useState<Tab>("datasets");
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    msg: string;
    fn: () => Promise<unknown>;
  } | null>(null);
  const [inspectId, setInspectId] = useState<string | null>(null);

  /* ─── QUERIES ─── */
  const { data: datasetsData, isLoading: datasetsLoading } = useQuery({
    queryKey: ["admin-datasets"],
    queryFn: () =>
      apiRequest<{ datasets: Record<string, unknown>[] }>(
        EP.ADMIN_DATASETS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "datasets",
  });

  const { data: submissionsData, isLoading: submissionsLoading } = useQuery({
    queryKey: ["admin-rlhf-submissions"],
    queryFn: () =>
      apiRequest<{ submissions: Record<string, unknown>[] }>(
        EP.ADMIN_RLHF_SUBMISSIONS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "submissions",
  });

  const { data: tasksData } = useQuery({
    queryKey: ["admin-dataset-tasks", inspectId],
    queryFn: () =>
      apiRequest<{ tasks: Record<string, unknown>[] }>(
        EP.ADMIN_DATASET_TASKS(inspectId!),
        "GET",
        undefined,
        true,
      ),
    enabled: !!inspectId && tab === "datasets",
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
      queryClient.invalidateQueries({ queryKey: ["admin-datasets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-rlhf-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dataset-tasks"] });
      setConfirmAction(null);
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const metrics = [
    { label: "Datasets", value: datasetsData?.datasets?.length ?? "—" },
    {
      label: "Submissions",
      value: submissionsData?.submissions?.length ?? "—",
    },
    {
      label: "Pending Review",
      value:
        submissionsData?.submissions?.filter((s) => s.status === "pending")
          .length ?? 0,
      color: "var(--color-warning)",
    },
  ];

  const datasetCols: Column<Record<string, unknown>>[] = [
    { key: "name", header: "Name", sortable: true },
    {
      key: "type",
      header: "Type",
      render: (r) => <Badge status={String(r.type)} />,
    },
    { key: "category", header: "Category" },
    {
      key: "taskCount",
      header: "Tasks",
      render: (r) => {
        const t = r.tasks as unknown[] | undefined;
        return t?.length ?? String(r.taskCount ?? 0);
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button
          className="u-btn u-btn-ghost u-btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            setInspectId(String(r._id));
          }}
        >
          Tasks →
        </button>
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
      key: "dataset",
      header: "Dataset",
      render: (r) => {
        const d = r.datasetId as Record<string, unknown> | undefined;
        return d?.name ? String(d.name) : String(r.datasetId || "—");
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge status={String(r.status)} />,
    },
    {
      key: "submittedAt",
      header: "Date",
      render: (r) =>
        r.createdAt ? new Date(String(r.createdAt)).toLocaleDateString() : "—",
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.status === "pending" ? (
          <div style={{ display: "flex", gap: "var(--space-1)" }}>
            <button
              className="u-btn u-btn-primary u-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmAction({
                  title: "Approve",
                  msg: "Approve this submission?",
                  fn: () =>
                    actionMut.mutateAsync({
                      url: EP.ADMIN_RLHF_SUBMISSION_REVIEW(String(r._id)),
                      method: "PUT",
                      body: { result: "approved" },
                    }),
                });
              }}
            >
              Approve
            </button>
            <button
              className="u-btn u-btn-danger u-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmAction({
                  title: "Reject",
                  msg: "Reject this submission?",
                  fn: () =>
                    actionMut.mutateAsync({
                      url: EP.ADMIN_RLHF_SUBMISSION_REVIEW(String(r._id)),
                      method: "PUT",
                      body: { result: "rejected" },
                    }),
                });
              }}
            >
              Reject
            </button>
          </div>
        ) : null,
    },
  ];

  const taskCols: Column<Record<string, unknown>>[] = [
    {
      key: "prompt",
      header: "Prompt",
      render: (r) => {
        const txt = String(r.prompt || "—");
        return txt.length > 60 ? txt.slice(0, 60) + "…" : txt;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge status={String(r.status || "pending")} />,
    },
    {
      key: "assignedTo",
      header: "Assigned",
      render: (r) => {
        const w = r.assignedTo as Record<string, unknown> | undefined;
        return w?.name ? String(w.name) : "—";
      },
    },
  ];

  return (
    <div style={{ padding: "var(--space-5)" }}>
      <h1 className="u-heading-1" style={{ marginBottom: "var(--space-4)" }}>
        RLHF Engine
      </h1>

      <MetricsRibbon
        metrics={metrics}
        loading={datasetsLoading || submissionsLoading}
      />

      <div className="tab-bar" style={{ marginTop: "var(--space-4)" }}>
        {(["datasets", "submissions"] as Tab[]).map((t) => (
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
          {tab === "datasets" && (
            <DataGrid
              columns={datasetCols}
              data={(datasetsData?.datasets ?? []) as Record<string, unknown>[]}
              loading={datasetsLoading}
              rowKey={(r) => String(r._id)}
            />
          )}
          {tab === "submissions" && (
            <DataGrid
              columns={submissionCols}
              data={
                (submissionsData?.submissions ?? []) as Record<
                  string,
                  unknown
                >[]
              }
              loading={submissionsLoading}
              emptyMessage="No submissions"
              rowKey={(r) => String(r._id)}
            />
          )}
        </div>

        {/* Task Inspector */}
        {inspectId && tab === "datasets" && (
          <aside style={inspectorStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-4)",
              }}
            >
              <h3 className="u-heading-3">Dataset Tasks</h3>
              <button
                className="u-btn u-btn-ghost u-btn-sm"
                onClick={() => setInspectId(null)}
              >
                ✕
              </button>
            </div>
            {tasksData?.tasks && tasksData.tasks.length > 0 ? (
              <DataGrid
                columns={taskCols}
                data={tasksData.tasks as Record<string, unknown>[]}
                rowKey={(r) => String(r._id)}
              />
            ) : (
              <div
                style={{
                  color: "var(--color-text-tertiary)",
                  fontSize: "var(--text-sm)",
                }}
              >
                No tasks in this dataset.
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

const inspectorStyle: React.CSSProperties = {
  width: 400,
  flexShrink: 0,
  borderLeft: "1px solid var(--color-border)",
  background: "var(--color-bg-secondary)",
  padding: "var(--space-4)",
  overflowY: "auto",
  maxHeight: "calc(100vh - 180px)",
  borderRadius: "var(--radius-lg)",
};
