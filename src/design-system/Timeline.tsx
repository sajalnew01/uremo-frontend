"use client";

import { Badge } from "./Badge";

interface TimelineEntry {
  action?: string;
  status?: string;
  at: string;
  by?: string;
}

interface TimelineProps {
  entries: TimelineEntry[];
  entityType?: string;
}

export function Timeline({ entries }: TimelineProps) {
  if (!entries?.length) {
    return <div style={{ color: "var(--color-text-tertiary)", fontSize: "var(--text-sm)" }}>No history</div>;
  }

  return (
    <div style={{ position: "relative", paddingLeft: 24 }}>
      <div
        style={{
          position: "absolute",
          left: 7,
          top: 4,
          bottom: 4,
          width: 2,
          background: "var(--color-border)",
        }}
      />
      {entries.map((e, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            paddingBottom: "var(--space-4)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -20,
              top: 4,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: i === entries.length - 1 ? "var(--color-brand)" : "var(--color-border)",
              border: "2px solid var(--color-bg-secondary)",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            {(e.status || e.action) && (
              <Badge status={e.status ?? e.action ?? ""} label={e.action ?? e.status} size="sm" />
            )}
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
              {new Date(e.at).toLocaleString()}
            </span>
            {e.by && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                by {e.by}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
