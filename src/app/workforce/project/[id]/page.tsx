"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, ApiError } from "@/lib/api";
import { EP } from "@/lib/api/endpoints";
import { useRequireAuth } from "@/hooks/useAuth";

type ProjectDoc = {
  _id: string;
  title: string;
  description?: string;
  instructions?: string;
  deliverables?: Array<{
    title?: string;
    description?: string;
    required?: boolean;
  }>;
  payRate?: number;
  payType?: string;
  estimatedTasks?: number;
  status: string;
  deadline?: string;
  projectType?: "standard" | "rlhf_dataset";
  rewardPerTask?: number;
  datasetId?: {
    _id: string;
    name?: string;
    datasetType?: string;
    difficultyLevel?: string;
    minJustificationWords?: number;
    minWordCount?: number;
    allowMultiResponseComparison?: boolean;
    isActive?: boolean;
  };
};

type ProjectResponse = { project: ProjectDoc };

type RlhfTask = {
  _id: string;
  prompt: string;
  responseA?: string;
  responseB?: string;
  imageUrl?: string;
  submitted?: boolean;
};

type RlhfTasksResponse = {
  success: boolean;
  dataset: {
    _id: string;
    name?: string;
    datasetType?: string;
    difficultyLevel?: string;
    minJustificationWords?: number;
    minWordCount?: number;
  };
  tasks: RlhfTask[];
  project: { _id: string; title: string; rewardPerTask?: number };
  submissionCount: number;
  totalTasks: number;
};

export default function WorkforceProjectPage() {
  const isAuthed = useRequireAuth();
  const params = useParams<{ id: string }>();
  const projectId = params?.id;
  const qc = useQueryClient();

  const [completionNotes, setCompletionNotes] = useState<string>("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [answerPayload, setAnswerPayload] = useState<Record<string, unknown>>(
    {},
  );

  const projectQuery = useQuery({
    queryKey: ["workspace", "project", projectId],
    queryFn: async () =>
      apiRequest<ProjectResponse>(
        EP.WORKSPACE_PROJECT(String(projectId)),
        "GET",
        undefined,
        true,
      ),
    enabled: Boolean(isAuthed && projectId),
  });

  const project = projectQuery.data?.project;

  const startMutation = useMutation({
    mutationFn: async () =>
      apiRequest<{ success: boolean; message?: string; project?: unknown }>(
        EP.WORKSPACE_PROJECT_START(String(projectId)),
        "POST",
        {},
        true,
      ),
    onSuccess: async (data) => {
      setActionMsg(data.message || "Project started");
      setActionErr(null);
      await qc.invalidateQueries({
        queryKey: ["workspace", "project", projectId],
      });
      await qc.invalidateQueries({ queryKey: ["workspace", "projects"] });
      await qc.invalidateQueries({ queryKey: ["workspace", "profile"] });
    },
    onError: (e) => {
      setActionErr(e instanceof Error ? e.message : "Failed to start project");
      setActionMsg(null);
    },
  });

  const submitProjectMutation = useMutation({
    mutationFn: async () =>
      apiRequest<{ success: boolean; message?: string }>(
        EP.WORKSPACE_PROJECT_SUBMIT(String(projectId)),
        "POST",
        { completionNotes },
        true,
      ),
    onSuccess: async (data) => {
      setActionMsg(data.message || "Project submitted");
      setActionErr(null);
      await qc.invalidateQueries({
        queryKey: ["workspace", "project", projectId],
      });
      await qc.invalidateQueries({ queryKey: ["workspace", "projects"] });
      await qc.invalidateQueries({ queryKey: ["workspace", "profile"] });
    },
    onError: (e) => {
      setActionErr(e instanceof Error ? e.message : "Failed to submit project");
      setActionMsg(null);
    },
  });

  const rlhfEnabled = Boolean(
    project && project.projectType === "rlhf_dataset",
  );

  const rlhfQuery = useQuery({
    queryKey: ["workspace", "project", projectId, "rlhf"],
    queryFn: async () =>
      apiRequest<RlhfTasksResponse>(
        EP.WORKSPACE_PROJECT_RLHF_TASKS(String(projectId)),
        "GET",
        undefined,
        true,
      ),
    enabled: Boolean(isAuthed && projectId && rlhfEnabled),
  });

  const datasetType = rlhfQuery.data?.dataset?.datasetType;
  const tasks = rlhfQuery.data?.tasks || [];
  const openTasks = useMemo(() => tasks.filter((t) => !t.submitted), [tasks]);
  const selectedTask = useMemo(
    () => tasks.find((t) => t._id === selectedTaskId) || null,
    [tasks, selectedTaskId],
  );

  const submitTaskMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTaskId) throw new Error("Select a task first");
      if (!answerPayload || typeof answerPayload !== "object") {
        throw new Error("Answer payload is required");
      }
      return apiRequest<{ success: boolean; submission?: unknown }>(
        EP.WORKSPACE_PROJECT_RLHF_SUBMIT(String(projectId)),
        "POST",
        { taskId: selectedTaskId, answerPayload },
        true,
      );
    },
    onSuccess: async () => {
      setActionMsg("Task submitted");
      setActionErr(null);
      setSelectedTaskId("");
      setAnswerPayload({});
      await qc.invalidateQueries({
        queryKey: ["workspace", "project", projectId, "rlhf"],
      });
    },
    onError: (e) => {
      if (e instanceof ApiError) setActionErr(e.message);
      else
        setActionErr(e instanceof Error ? e.message : "Failed to submit task");
      setActionMsg(null);
    },
  });

  if (!isAuthed) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Project</div>
            <div className="mt-1 text-sm text-[var(--muted)]">{projectId}</div>
          </div>
          <Link
            href="/workforce"
            className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
          >
            Back
          </Link>
        </div>

        {actionMsg ? (
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm">
            {actionMsg}
          </div>
        ) : null}
        {actionErr ? (
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm">
            {actionErr}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        {projectQuery.isLoading ? (
          <div className="text-sm text-[var(--muted)]">Loading project...</div>
        ) : projectQuery.isError ? (
          <div className="text-sm text-[var(--muted)]">
            Failed to load project.
          </div>
        ) : !project ? (
          <div className="text-sm text-[var(--muted)]">Project not found.</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold tracking-tight">
                {project.title}
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                {project.description || "No description"}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1">
                  Status: {project.status}
                </span>
                <span className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1">
                  Pay: {project.payRate ?? "—"} ({project.payType || "—"})
                </span>
                <span className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1">
                  Type: {project.projectType || "standard"}
                </span>
                {project.deadline ? (
                  <span className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1">
                    Deadline: {new Date(project.deadline).toLocaleString()}
                  </span>
                ) : null}
              </div>
            </div>

            {project.instructions ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Instructions
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm">
                  {project.instructions}
                </div>
              </div>
            ) : null}

            {project.deliverables && project.deliverables.length > 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Deliverables
                </div>
                <div className="mt-2 space-y-2">
                  {project.deliverables.map((d, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2"
                    >
                      <div className="text-sm font-semibold">
                        {d.title || `Item ${idx + 1}`}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {d.required === false ? "Optional" : "Required"}
                        {d.description ? ` · ${d.description}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={
                  startMutation.isPending || project.status !== "assigned"
                }
                onClick={() => {
                  setActionMsg(null);
                  setActionErr(null);
                  startMutation.mutate();
                }}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
              >
                {startMutation.isPending ? "Starting..." : "Start Project"}
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="text-sm font-semibold">Submit Completion</div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                Submits the project for review; earnings are credited after
                admin approval.
              </div>

              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={5}
                className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm"
                placeholder="Completion notes (optional)"
              />
              <button
                type="button"
                disabled={
                  submitProjectMutation.isPending ||
                  project.status === "completed"
                }
                onClick={() => {
                  setActionMsg(null);
                  setActionErr(null);
                  submitProjectMutation.mutate();
                }}
                className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
              >
                {submitProjectMutation.isPending
                  ? "Submitting..."
                  : "Submit Project"}
              </button>
            </div>

            {project.projectType === "rlhf_dataset" ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-sm font-semibold">RLHF Tasks</div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  Complete dataset tasks linked to this project.
                </div>

                {rlhfQuery.isLoading ? (
                  <div className="mt-3 text-sm text-[var(--muted)]">
                    Loading tasks...
                  </div>
                ) : rlhfQuery.isError ? (
                  <div className="mt-3 text-sm text-[var(--muted)]">
                    Failed to load RLHF tasks.
                  </div>
                ) : !rlhfQuery.data ? (
                  <div className="mt-3 text-sm text-[var(--muted)]">
                    No RLHF dataset available.
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2 py-1">
                        Dataset: {rlhfQuery.data.dataset?.name || "—"}
                      </span>
                      <span className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2 py-1">
                        Type: {rlhfQuery.data.dataset?.datasetType || "—"}
                      </span>
                      <span className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2 py-1">
                        Submitted: {rlhfQuery.data.submissionCount}/
                        {rlhfQuery.data.totalTasks}
                      </span>
                      <span className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2 py-1">
                        Reward/task:{" "}
                        {rlhfQuery.data.project?.rewardPerTask ??
                          project.rewardPerTask ??
                          0}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                        Select Task
                      </div>
                      <select
                        value={selectedTaskId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedTaskId(id);
                          setAnswerPayload({});
                        }}
                        className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm"
                      >
                        <option value="">Choose a pending task</option>
                        {openTasks.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t._id.slice(0, 8)} — {t.prompt.slice(0, 60)}
                          </option>
                        ))}
                      </select>
                      {openTasks.length === 0 ? (
                        <div className="mt-2 text-sm text-[var(--muted)]">
                          All tasks submitted.
                        </div>
                      ) : null}
                    </div>

                    {selectedTask ? (
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                          Prompt
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm">
                          {selectedTask.prompt}
                        </div>

                        {selectedTask.imageUrl ? (
                          <img
                            src={selectedTask.imageUrl}
                            alt="task"
                            className="mt-3 max-h-64 w-full rounded-xl object-contain"
                          />
                        ) : null}

                        {selectedTask.responseA || selectedTask.responseB ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                Response A
                              </div>
                              <div className="mt-2 whitespace-pre-wrap text-sm">
                                {selectedTask.responseA || "—"}
                              </div>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                Response B
                              </div>
                              <div className="mt-2 whitespace-pre-wrap text-sm">
                                {selectedTask.responseB || "—"}
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {datasetType === "ranking" ? (
                          <div className="mt-4 space-y-3">
                            <div className="flex flex-wrap gap-3">
                              {(["A", "B"] as const).map((c) => (
                                <label
                                  key={c}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <input
                                    type="radio"
                                    name="rlhf-choice"
                                    checked={
                                      String(answerPayload.choice || "") === c
                                    }
                                    onChange={() =>
                                      setAnswerPayload((p) => ({
                                        ...p,
                                        choice: c,
                                      }))
                                    }
                                  />
                                  Choose {c}
                                </label>
                              ))}
                            </div>
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                Justification
                              </div>
                              <textarea
                                value={String(
                                  answerPayload.justification || "",
                                )}
                                onChange={(e) =>
                                  setAnswerPayload((p) => ({
                                    ...p,
                                    justification: e.target.value,
                                  }))
                                }
                                rows={5}
                                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                                placeholder={`Minimum words: ${rlhfQuery.data?.dataset?.minJustificationWords || 30}`}
                              />
                            </div>
                          </div>
                        ) : datasetType === "fact_check" ? (
                          <div className="mt-4 space-y-3">
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                Verdict
                              </div>
                              <select
                                value={String(answerPayload.verdict || "")}
                                onChange={(e) =>
                                  setAnswerPayload((p) => ({
                                    ...p,
                                    verdict: e.target.value,
                                  }))
                                }
                                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                              >
                                <option value="">Select</option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                                <option value="misleading">misleading</option>
                                <option value="unverifiable">
                                  unverifiable
                                </option>
                              </select>
                            </div>
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                Source URL
                              </div>
                              <input
                                type="url"
                                value={String(answerPayload.sourceUrl || "")}
                                onChange={(e) =>
                                  setAnswerPayload((p) => ({
                                    ...p,
                                    sourceUrl: e.target.value,
                                  }))
                                }
                                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                Explanation
                              </div>
                              <textarea
                                value={String(answerPayload.explanation || "")}
                                onChange={(e) =>
                                  setAnswerPayload((p) => ({
                                    ...p,
                                    explanation: e.target.value,
                                  }))
                                }
                                rows={5}
                                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                        ) : datasetType === "coding" ? (
                          <div className="mt-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                              Code
                            </div>
                            <textarea
                              value={String(answerPayload.code || "")}
                              onChange={(e) =>
                                setAnswerPayload((p) => ({
                                  ...p,
                                  code: e.target.value,
                                }))
                              }
                              rows={10}
                              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm"
                            />
                          </div>
                        ) : datasetType === "multimodal" ? (
                          <div className="mt-4 space-y-3">
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                Description
                              </div>
                              <textarea
                                value={String(answerPayload.description || "")}
                                onChange={(e) =>
                                  setAnswerPayload((p) => ({
                                    ...p,
                                    description: e.target.value,
                                  }))
                                }
                                rows={5}
                                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                Rating (1-5)
                              </div>
                              <input
                                type="number"
                                min={1}
                                max={5}
                                value={Number(answerPayload.rating || 0)}
                                onChange={(e) =>
                                  setAnswerPayload((p) => ({
                                    ...p,
                                    rating: Number(e.target.value || 0),
                                  }))
                                }
                                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                              Response
                            </div>
                            <textarea
                              value={String(answerPayload.response || "")}
                              onChange={(e) =>
                                setAnswerPayload((p) => ({
                                  ...p,
                                  response: e.target.value,
                                }))
                              }
                              rows={6}
                              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                              placeholder={`Minimum words: ${rlhfQuery.data?.dataset?.minWordCount || 20}`}
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={submitTaskMutation.isPending}
                          onClick={() => {
                            setActionMsg(null);
                            setActionErr(null);
                            submitTaskMutation.mutate();
                          }}
                          className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                        >
                          {submitTaskMutation.isPending
                            ? "Submitting..."
                            : "Submit Task"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
