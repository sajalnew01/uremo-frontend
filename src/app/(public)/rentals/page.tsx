"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { useRequireAuth } from "@/hooks/useAuth";
import { Badge } from "@/design-system";
import Link from "next/link";
import type { Rental } from "@/types";

export default function RentalsPage() {
  const ready = useRequireAuth();

  const { data, isLoading, error } = useQuery<{ rentals: Rental[] }>({
    queryKey: ["my-rentals"],
    queryFn: () => apiRequest(EP.RENTALS_MY, "GET", undefined, true),
    enabled: ready,
  });

  if (!ready) return null;

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "var(--color-success)";
      case "expired": return "var(--color-error)";
      case "pending": return "var(--color-warning)";
      case "cancelled": return "var(--color-text-tertiary)";
      default: return "var(--color-info)";
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">My Rentals</h1>
        <p className="page-subtitle">Manage your active and past rentals.</p>
      </div>

      {isLoading ? (
        <div className="page-loading"><div className="u-spinner" /> Loading...</div>
      ) : error ? (
        <div className="page-empty">Failed to load rentals.</div>
      ) : !data?.rentals?.length ? (
        <div className="page-empty">
          No rentals yet. <Link href="/explore?intent=rent" style={{ color: "var(--color-brand)" }}>Browse rentable services</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {data.rentals.map((rental) => {
            const svc = typeof rental.service === "object" ? rental.service : null;
            return (
              <div key={rental._id} className="u-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
                <div>
                  <div style={{ fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-1)" }}>
                    {svc?.title || "Service"}
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    {rental.rentalType} — {rental.duration} days — ${rental.price}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginTop: "var(--space-1)" }}>
                    {new Date(rental.startDate).toLocaleDateString()} → {new Date(rental.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <Badge status={rental.status} />
                  {rental.isExpiringSoon && (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-warning)" }}>
                      Expiring soon ({rental.daysRemaining}d left)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
