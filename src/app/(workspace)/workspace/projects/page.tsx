"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { Badge } from "@/design-system";
import Link from "next/link";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const { data, isLoading } = useQuery<{ projects: Project[] }>({
    queryKey: ["ws-projects"],
    queryFn: () => apiRequest(EP.WORKSPACE_PROJECTS, "GET", undefined, true),
  });

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: "var(--space-6)" }}>Projects</h1>

      {isLoading ? (
        <div className="page-loading"><div className="u-spinner" /> Loading...</div>
      ) : !data?.projects?.length ? (
        <div className="page-empty">No projects assigned yet. Check back when your status advances.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {data.projects.map((p) => (
            <Link
              key={p._id}
              href={`/workspace/project/${p._id}`}
              className="u-card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit" }}
            >
              <div>
                <div style={{ fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-1)" }}>
                  {p.title}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                  {p.category} · ${p.payRate}/{p.payType} · {p.projectType}
                </div>
              </div>
              <Badge status={p.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
