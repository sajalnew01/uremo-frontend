"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { Badge, StateVisualizer } from "@/design-system";
import { emitToast } from "@/hooks/useToast";
import Link from "next/link";
import type { ApplyWork, WorkPosition } from "@/types";

export default function WorkspacePage() {
  const queryClient = useQueryClient();

  const { data: appData, isLoading: appLoading } = useQuery<{ applications: ApplyWork[] }>({
    queryKey: ["my-applications"],
    queryFn: () => apiRequest(EP.APPLY_WORK_ME, "GET", undefined, true),
  });

  const { data: positionsData } = useQuery<{ positions: WorkPosition[] }>({
    queryKey: ["work-positions"],
    queryFn: () => apiRequest(EP.WORK_POSITIONS),
  });

  const applyMutation = useMutation({
    mutationFn: (positionId: string) =>
      apiRequest(EP.APPLY_WORK, "POST", { positionId }, true),
    onSuccess: () => {
      emitToast("Application submitted!", "success");
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const currentApp = appData?.applications?.[0];
  const workerStatus = currentApp?.workerStatus || "fresh";

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: "var(--space-6)" }}>Workspace</h1>

      {/* Worker State Machine */}
      <div className="u-card" style={{ marginBottom: "var(--space-6)" }}>
        <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Your Worker Journey</h3>
        <StateVisualizer entity="worker" currentState={workerStatus} compact />
      </div>

      {/* Application Status */}
      {currentApp ? (
        <div className="u-card" style={{ marginBottom: "var(--space-6)" }}>
          <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Application</h3>
          <div className="u-grid u-grid-3">
            <div>
              <div className="stat-card-label">Status</div>
              <Badge status={currentApp.status} />
            </div>
            <div>
              <div className="stat-card-label">Worker Status</div>
              <Badge status={currentApp.workerStatus} />
            </div>
            <div>
              <div className="stat-card-label">Category</div>
              <span style={{ fontSize: "var(--text-sm)" }}>{currentApp.category}</span>
            </div>
          </div>

          {/* Training link if applicable */}
          {currentApp.workerStatus === "screening_unlocked" && !currentApp.trainingViewed && (
            <div className="u-panel" style={{ marginTop: "var(--space-4)", borderColor: "var(--color-warning)" }}>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-warning)" }}>
                ⚠️ Training materials are available. View them before proceeding to screening.
              </p>
            </div>
          )}

          {/* Screenings completed */}
          {currentApp.screeningsCompleted && currentApp.screeningsCompleted.length > 0 && (
            <div style={{ marginTop: "var(--space-4)" }}>
              <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-3)" }}>
                Completed Screenings
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {currentApp.screeningsCompleted.map((sc, i) => (
                  <div key={i} className="u-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "var(--text-sm)" }}>Screening {i + 1}</span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginLeft: "var(--space-2)" }}>
                        Score: {sc.score}
                      </span>
                    </div>
                    <Badge status={sc.passed ? "Passed" : "Failed"} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* No application — show available positions */
        <div className="u-card" style={{ marginBottom: "var(--space-6)" }}>
          <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Apply to Work</h3>
          {!positionsData?.positions?.length ? (
            <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--text-sm)" }}>
              No open positions right now. Check back soon!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {positionsData.positions.filter((p) => p.isActive).map((pos) => (
                <div key={pos._id} className="u-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)" }}>{pos.title}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>{pos.category}</div>
                  </div>
                  <button
                    className="u-btn u-btn-primary u-btn-sm"
                    onClick={() => applyMutation.mutate(pos._id)}
                    disabled={applyMutation.isPending}
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div className="u-grid u-grid-3">
        <Link href="/workspace/screenings" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-card-label">Screenings</div>
          <div style={{ fontSize: "var(--text-sm)" }}>View & take screenings</div>
        </Link>
        <Link href="/workspace/projects" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-card-label">Projects</div>
          <div style={{ fontSize: "var(--text-sm)" }}>Active work assignments</div>
        </Link>
        <Link href="/workspace/earnings" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-card-label">Earnings</div>
          <div style={{ fontSize: "var(--text-sm)" }}>Track & withdraw earnings</div>
        </Link>
      </div>
    </div>
  );
}
