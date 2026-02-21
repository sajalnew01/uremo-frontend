"use client";

import { useState, type ReactNode } from "react";

/* ─── DATA GRID ─── */
export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  width?: string;
  sortable?: boolean;
}

interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (p: number) => void;
  rowKey?: (row: T) => string;
}

export function DataGrid<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  emptyMessage = "No data",
  onRowClick,
  page = 1,
  totalPages = 1,
  onPageChange,
  rowKey,
}: DataGridProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = String(a[sortKey] ?? "");
        const bv = String(b[sortKey] ?? "");
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : data;

  if (loading) {
    return (
      <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
        <div className="u-spinner" style={{ margin: "0 auto" }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "var(--text-sm)",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{
                    textAlign: "left",
                    padding: "var(--space-3) var(--space-4)",
                    color: "var(--color-text-secondary)",
                    fontWeight: "var(--weight-medium)" as unknown as number,
                    fontSize: "var(--text-xs)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    cursor: col.sortable ? "pointer" : "default",
                    width: col.width,
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  {col.header}
                  {sortKey === col.key && (sortDir === "asc" ? " ↑" : " ↓")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: "var(--space-8)",
                    textAlign: "center",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row) : i}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    borderBottom: "1px solid var(--color-border-subtle)",
                    cursor: onRowClick ? "pointer" : "default",
                    transition: "background var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: "var(--space-3) var(--space-4)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.render
                        ? col.render(row)
                        : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && onPageChange && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-2)",
            padding: "var(--space-4)",
          }}
        >
          <button
            className="u-btn u-btn-ghost u-btn-sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            ← Prev
          </button>
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-secondary)",
            }}
          >
            {page} / {totalPages}
          </span>
          <button
            className="u-btn u-btn-ghost u-btn-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
