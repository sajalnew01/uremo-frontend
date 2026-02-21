"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { Badge, ConfirmModal, StateVisualizer } from "@/design-system";
import { emitToast } from "@/hooks/useToast";
import type { Project, DatasetTask, RlhfSubmission } from "@/types";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [proofText, setProofText] = useState("");
  const [showSubmitProof, setShowSubmitProof] = useState(false);
  const [rlhfAnswer, setRlhfAnswer] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<{ project: Project }>({
    queryKey: ["ws-project", id],
    queryFn: () => apiRequest(EP.WORKSPACE_PROJECT(id), "GET", undefined, true),
    enabled: !!id,
  });

  // RLHF tasks for dataset projects
  const { data: rlhfData } = useQuery<{ tasks: DatasetTask[] }>({
    queryKey: ["ws-rlhf-tasks", id],
    queryFn: () => apiRequest(EP.WORKSPACE_PROJECT_RLHF_TASKS(id), "GET", undefined, true),
    enabled: !!id && data?.project?.projectType === "rlhf_dataset",
  });

  const startMutation = useMutation({
    mutationFn: () => apiRequest(EP.WORKSPACE_PROJECT_START(id), "POST", undefined, true),
    onSuccess: () => {
      emitToast("Project started!", "success");
      queryClient.invalidateQueries({ queryKey: ["ws-project", id] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const submitMutation = useMutation({
    mutationFn: () => apiRequest(EP.WORKSPACE_PROJECT_SUBMIT(id), "POST", undefined, true),
    onSuccess: () => {
      emitToast("Project submitted for review!", "success");
      queryClient.invalidateQueries({ queryKey: ["ws-project", id] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const proofMutation = useMutation({
    mutationFn: () =>
      apiRequest(EP.WORKSPACE_PROJECT_PROOF(id), "POST", { submissionText: proofText }, true),
    onSuccess: () => {
      emitToast("Proof submitted!", "success");
      setProofText("");
      setShowSubmitProof(false);
      queryClient.invalidateQueries({ queryKey: ["ws-project", id] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const rlhfSubmitMutation = useMutation({
    mutationFn: (payload: { taskId: string; answerPayload: Record<string, string> }) =>
      apiRequest(EP.WORKSPACE_PROJECT_RLHF_SUBMIT(id), "POST", payload, true),
    onSuccess: () => {
      emitToast("RLHF response submitted!", "success");
      setRlhfAnswer({});
      queryClient.invalidateQueries({ queryKey: ["ws-rlhf-tasks", id] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const project = data?.project;

  if (isLoading) return <div className="page-loading"><div className="u-spinner" /> Loading...</div>;
  if (!project) return <div className="page-empty">Project not found.</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 className="page-title" style={{ marginBottom: "var(--space-2)" }}>{project.title}</h1>
      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
        <Badge status={project.status} />
        <Badge status={project.projectType} size="sm" />
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)" }}>
          ${project.payRate}/{project.payType}
        </span>
      </div>

      {/* State Machine */}
      <div className="u-card" style={{ marginBottom: "var(--space-6)" }}>
        <StateVisualizer entity="project" currentState={project.status} compact />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        {project.status === "assigned" && (
          <button className="u-btn u-btn-primary" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
            {startMutation.isPending ? "Starting..." : "Start Project"}
          </button>
        )}
        {project.status === "in_progress" && (
          <>
            <button className="u-btn u-btn-primary" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting..." : "Submit Project"}
            </button>
            <button className="u-btn u-btn-secondary" onClick={() => setShowSubmitProof(true)}>
              Submit Proof of Work
            </button>
          </>
        )}
      </div>

      {/* RLHF Tasks */}
      {project.projectType === "rlhf_dataset" && rlhfData?.tasks && (
        <div className="page-section">
          <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>RLHF Tasks</h3>
          {rlhfData.tasks.length === 0 ? (
            <div className="page-empty">No tasks available.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {rlhfData.tasks.map((task) => (
                <div key={task._id} className="u-card">
                  <div style={{ fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-3)" }}>
                    {task.prompt}
                  </div>

                  {task.responseA && (
                    <div className="u-panel" style={{ marginBottom: "var(--space-2)" }}>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginBottom: "var(--space-1)" }}>Response A</div>
                      <p style={{ fontSize: "var(--text-sm)" }}>{task.responseA}</p>
                    </div>
                  )}
                  {task.responseB && (
                    <div className="u-panel" style={{ marginBottom: "var(--space-3)" }}>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginBottom: "var(--space-1)" }}>Response B</div>
                      <p style={{ fontSize: "var(--text-sm)" }}>{task.responseB}</p>
                    </div>
                  )}

                  {task.imageUrl && (
                    <img src={task.imageUrl} alt="Task image" style={{ maxWidth: 400, borderRadius: "var(--radius-md)", marginBottom: "var(--space-3)" }} />
                  )}

                  <textarea
                    className="u-input"
                    rows={3}
                    placeholder="Your answer / justification..."
                    value={rlhfAnswer[task._id] || ""}
                    onChange={(e) => setRlhfAnswer((prev) => ({ ...prev, [task._id]: e.target.value }))}
                  />
                  <button
                    className="u-btn u-btn-primary u-btn-sm"
                    style={{ marginTop: "var(--space-2)" }}
                    disabled={!rlhfAnswer[task._id]?.trim() || rlhfSubmitMutation.isPending}
                    onClick={() => rlhfSubmitMutation.mutate({ taskId: task._id, answerPayload: { answer: rlhfAnswer[task._id] } })}
                  >
                    Submit Answer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proof Submission Modal */}
      {showSubmitProof && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: "var(--z-modal)" as unknown as number }}>
          <div className="u-card" style={{ maxWidth: 500, width: "100%" }}>
            <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Submit Proof of Work</h3>
            <textarea
              className="u-input"
              rows={6}
              placeholder="Describe your work, paste links, etc..."
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
            />
            <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)", justifyContent: "flex-end" }}>
              <button className="u-btn u-btn-ghost" onClick={() => setShowSubmitProof(false)}>Cancel</button>
              <button
                className="u-btn u-btn-primary"
                disabled={!proofText.trim() || proofMutation.isPending}
                onClick={() => proofMutation.mutate()}
              >
                {proofMutation.isPending ? "Submitting..." : "Submit Proof"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
