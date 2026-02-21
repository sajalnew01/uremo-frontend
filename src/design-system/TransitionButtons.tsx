"use client";

import { useState } from "react";
import type { FlowEntity } from "@/types/flow";
import { getAllowedTransitions, getTransitionLabel } from "@/types/flow";
import { ConfirmModal } from "./Modal";

interface TransitionButtonsProps {
  entity: FlowEntity;
  currentState: string;
  onTransition: (targetState: string) => Promise<void>;
  loading?: boolean;
}

/** Renders buttons for all valid transitions with confirmation */
export function TransitionButtons({
  entity,
  currentState,
  onTransition,
  loading,
}: TransitionButtonsProps) {
  const [confirming, setConfirming] = useState<string | null>(null);

  const allowed = getAllowedTransitions(entity, currentState);

  if (!allowed.length) {
    return (
      <div
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-tertiary)",
        }}
      >
        No transitions available (terminal state)
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {allowed.map((target) => {
          const label = getTransitionLabel(currentState, target);
          const isDanger = [
            "cancelled",
            "failed",
            "rejected",
            "closed",
            "suspended",
          ].includes(target);
          return (
            <button
              key={target}
              className={`u-btn u-btn-sm ${isDanger ? "u-btn-danger" : "u-btn-secondary"}`}
              onClick={() => setConfirming(target)}
              disabled={loading}
            >
              {label}
            </button>
          );
        })}
      </div>

      <ConfirmModal
        open={!!confirming}
        title="Confirm Transition"
        message={`Transition from "${currentState.replace(/_/g, " ")}" to "${confirming?.replace(/_/g, " ")}"?`}
        confirmLabel={
          confirming ? getTransitionLabel(currentState, confirming) : "Confirm"
        }
        confirmVariant={
          ["cancelled", "failed", "rejected", "closed", "suspended"].includes(
            confirming ?? "",
          )
            ? "danger"
            : "primary"
        }
        onConfirm={async () => {
          if (confirming) {
            await onTransition(confirming);
          }
          setConfirming(null);
        }}
        onCancel={() => setConfirming(null)}
      />
    </>
  );
}
