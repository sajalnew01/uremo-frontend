"use client";

import { type ReactNode } from "react";

/* ─── METRICS RIBBON ─── */
interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
  loading?: boolean;
}

export function MetricCard({ label, value, trend, color, loading }: MetricCardProps) {
  if (loading) {
    return (
      <div className="u-panel" style={{ minWidth: 140 }}>
        <div className="u-skeleton" style={{ height: 14, width: 80, marginBottom: 8 }} />
        <div className="u-skeleton" style={{ height: 28, width: 60 }} />
      </div>
    );
  }

  return (
    <div className="u-panel" style={{ minWidth: 140 }}>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginBottom: 4 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--weight-bold)" as unknown as number,
          color: color ?? "var(--color-text-primary)",
        }}
      >
        {value}
      </div>
      {trend && (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: 2 }}>
          {trend}
        </div>
      )}
    </div>
  );
}

interface MetricsRibbonProps {
  metrics: MetricCardProps[];
  loading?: boolean;
}

export function MetricsRibbon({ metrics, loading }: MetricsRibbonProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-3)",
        overflowX: "auto",
        padding: "var(--space-3) 0",
      }}
    >
      {metrics.map((m) => (
        <MetricCard key={m.label} {...m} loading={loading} />
      ))}
    </div>
  );
}

/* ─── PANEL LAYOUT ─── */
interface PanelLayoutProps {
  sidebar?: ReactNode;
  topBar?: ReactNode;
  main: ReactNode;
  inspector?: ReactNode;
  bottomBar?: ReactNode;
}

export function PanelLayout({ sidebar, topBar, main, inspector, bottomBar }: PanelLayoutProps) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {sidebar && (
        <aside
          style={{
            width: 240,
            borderRight: "1px solid var(--color-border)",
            background: "var(--color-bg-secondary)",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          {sidebar}
        </aside>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {topBar && (
          <div style={{ borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
            {topBar}
          </div>
        )}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-5)" }}>
            {main}
          </main>
          {inspector && (
            <aside
              style={{
                width: 360,
                borderLeft: "1px solid var(--color-border)",
                background: "var(--color-bg-secondary)",
                overflowY: "auto",
                flexShrink: 0,
              }}
            >
              {inspector}
            </aside>
          )}
        </div>
        {bottomBar && (
          <div
            style={{
              borderTop: "1px solid var(--color-border)",
              background: "var(--color-bg-secondary)",
              flexShrink: 0,
            }}
          >
            {bottomBar}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ACTION DOCK ─── */
interface ActionDockProps {
  children: ReactNode;
}

export function ActionDock({ children }: ActionDockProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-5)",
      }}
    >
      {children}
    </div>
  );
}
