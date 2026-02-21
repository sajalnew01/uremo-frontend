"use client";

import { Badge } from "./Badge";
import type { WalletTransaction } from "@/types";

interface WalletTransactionTableProps {
  transactions: WalletTransaction[];
  loading?: boolean;
}

export function WalletTransactionTable({
  transactions,
  loading,
}: WalletTransactionTableProps) {
  if (loading) {
    return (
      <div style={{ padding: "var(--space-6)", textAlign: "center" }}>
        <div className="u-spinner" style={{ margin: "0 auto" }} />
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div
        style={{
          padding: "var(--space-6)",
          textAlign: "center",
          color: "var(--color-text-tertiary)",
        }}
      >
        No transactions yet
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "var(--text-sm)",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Source</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr
              key={t._id}
              style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
            >
              <td style={tdStyle}>
                {new Date(t.createdAt).toLocaleDateString()}
              </td>
              <td style={tdStyle}>
                <span
                  style={{
                    color:
                      t.type === "credit"
                        ? "var(--color-success)"
                        : "var(--color-error)",
                    fontWeight: 500,
                  }}
                >
                  {t.type === "credit" ? "+" : "−"}
                </span>
              </td>
              <td style={tdStyle}>
                <span style={{ textTransform: "capitalize" }}>
                  {t.source?.replace(/_/g, " ") ?? "—"}
                </span>
              </td>
              <td style={tdStyle}>
                <span
                  style={{
                    color:
                      t.type === "credit"
                        ? "var(--color-success)"
                        : "var(--color-error)",
                    fontWeight: 600,
                  }}
                >
                  {t.type === "credit" ? "+" : "−"}${t.amount?.toFixed(2)}
                </span>
              </td>
              <td style={tdStyle}>
                <Badge status={t.status} size="sm" />
              </td>
              <td style={tdStyle}>
                {t.balanceAfter !== undefined
                  ? `$${t.balanceAfter.toFixed(2)}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "var(--space-3) var(--space-4)" as unknown as string,
  color: "var(--color-text-secondary)" as string,
  fontWeight: 500,
  fontSize: "var(--text-xs)" as string,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "var(--space-3) var(--space-4)" as unknown as string,
  whiteSpace: "nowrap" as const,
};
