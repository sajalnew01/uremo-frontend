"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { Badge } from "@/design-system";
import type { ProofOfWork } from "@/types";

export default function ProofsPage() {
  const { data, isLoading } = useQuery<{ proofs: ProofOfWork[] }>({
    queryKey: ["ws-proofs"],
    queryFn: () => apiRequest(EP.WORKSPACE_MY_PROOFS, "GET", undefined, true),
  });

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: "var(--space-6)" }}>Submitted Proofs</h1>

      {isLoading ? (
        <div className="page-loading"><div className="u-spinner" /> Loading...</div>
      ) : !data?.proofs?.length ? (
        <div className="page-empty">No proofs submitted yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {data.proofs.map((p) => (
            <div key={p._id} className="u-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
                <div>
                  <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)" }}>
                    Project: {p.projectId}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Badge status={p.status} />
              </div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap" }}>
                {p.submissionText}
              </p>
              {p.rejectionReason && (
                <div className="u-panel" style={{ marginTop: "var(--space-3)", borderColor: "var(--color-error)" }}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-error)" }}>
                    Rejection reason: {p.rejectionReason}
                  </span>
                </div>
              )}
              {p.attachments && p.attachments.length > 0 && (
                <div style={{ marginTop: "var(--space-3)", display: "flex", gap: "var(--space-2)" }}>
                  {p.attachments.map((att, i) => (
                    <a key={i} href={att.url} target="_blank" rel="noreferrer" style={{ fontSize: "var(--text-xs)", color: "var(--color-brand)" }}>
                      📎 {att.filename || `Attachment ${i + 1}`}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
