"use client";

import { STATUS_COLORS } from "./tokens";

interface BadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
}

export function Badge({ status, label, size = "md" }: BadgeProps) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  const displayLabel = label ?? status.replace(/_/g, " ");

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: size === "sm" ? "2px 8px" : "4px 12px",
        fontSize: size === "sm" ? "var(--text-xs)" : "var(--text-sm)",
        fontWeight: "var(--weight-medium)" as unknown as number,
        borderRadius: "var(--radius-full)",
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {displayLabel}
    </span>
  );
}
