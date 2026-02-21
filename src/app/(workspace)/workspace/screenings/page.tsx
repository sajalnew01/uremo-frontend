"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { Badge } from "@/design-system";
import Link from "next/link";
import type { Screening } from "@/types";

export default function ScreeningsPage() {
  const { data, isLoading } = useQuery<{ screenings: Screening[] }>({
    queryKey: ["ws-screenings"],
    queryFn: () => apiRequest(EP.WORKSPACE_SCREENINGS, "GET", undefined, true),
  });

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: "var(--space-6)" }}>Screenings</h1>

      {isLoading ? (
        <div className="page-loading"><div className="u-spinner" /> Loading...</div>
      ) : !data?.screenings?.length ? (
        <div className="page-empty">No screenings available for your current status.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {data.screenings.map((s) => (
            <Link
              key={s._id}
              href={`/workspace/screening/${s._id}`}
              className="u-card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit" }}
            >
              <div>
                <div style={{ fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-1)" }}>
                  {s.title}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                  {s.screeningType} · {s.questions?.length || 0} questions · {s.category}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Badge status={s.screeningType} size="sm" />
                <span style={{ color: "var(--color-brand)", fontSize: "var(--text-sm)" }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
