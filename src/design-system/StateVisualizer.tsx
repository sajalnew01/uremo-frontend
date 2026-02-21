"use client";

import { Badge } from "./Badge";
import type { FlowEntity } from "@/types/flow";
import { FLOW_TRANSITIONS } from "@/types/flow";

interface StateVisualizerProps {
  entity: FlowEntity;
  currentState: string;
  compact?: boolean;
}

/** Visual state machine — shows all states with current highlighted */
export function StateVisualizer({ entity, currentState, compact }: StateVisualizerProps) {
  const transitions = FLOW_TRANSITIONS[entity];
  if (!transitions) return null;

  const allStates = Object.keys(transitions);

  if (compact) {
    return (
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {allStates.map((s) => (
          <Badge key={s} status={s === currentState ? s : "draft"} label={s.replace(/_/g, " ")} size="sm" />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-1)",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {allStates.map((s, i) => {
        const isCurrent = s === currentState;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
            <div
              style={{
                padding: "var(--space-1) var(--space-3)",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)",
                fontWeight: isCurrent ? 600 : 400,
                background: isCurrent ? "var(--color-brand)" : "var(--color-bg-tertiary)",
                color: isCurrent ? "white" : "var(--color-text-tertiary)",
                border: isCurrent ? "none" : "1px solid var(--color-border-subtle)",
                whiteSpace: "nowrap",
              }}
            >
              {s.replace(/_/g, " ")}
            </div>
            {i < allStates.length - 1 && (
              <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
