"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { WalletTransaction } from "@/types";

/* ─── helpers ─── */
const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const statusColor: Record<string, string> = {
  initiated: "bg-yellow-500/15 text-yellow-400",
  pending: "bg-blue-500/15 text-blue-400",
  paid_unverified: "bg-orange-500/15 text-orange-300",
  success: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-red-500/15 text-red-400",
};

const sourceLabel: Record<string, string> = {
  topup: "Top-Up",
  service_purchase: "Service Purchase",
  rental_purchase: "Rental Purchase",
  rental_payment: "Rental Payment",
  admin_adjustment: "Admin Adjustment",
  refund: "Refund",
  earning: "Earnings",
  withdrawal_request: "Withdrawal Request",
  withdrawal_completed: "Withdrawal Paid",
};

interface TransactionsResponse {
  success: boolean;
  balance: number;
  transactions: WalletTransaction[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export default function FinanceTransactionsPage() {
  const ok = useRequireAuth();
  const [page, setPage] = useState(1);
  const limit = 20;

  const txQ = useQuery<TransactionsResponse>({
    queryKey: ["wallet-transactions", page],
    queryFn: () =>
      apiRequest<TransactionsResponse>(
        `${EP.WALLET_TRANSACTIONS}?page=${page}&limit=${limit}`,
        "GET",
        undefined,
        true,
      ),
    enabled: ok,
  });

  if (!ok) return null;

  const data = txQ.data;
  const txs = data?.transactions ?? [];
  const pag = data?.pagination;

  return (
    <div className="space-y-5">
      {/* ── Balance Header ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-[var(--muted)]">Current Balance</div>
          <div className="text-xl font-bold">
            {txQ.isLoading ? "…" : data ? fmt(data.balance) : "—"}
          </div>
        </div>
        {pag && (
          <div className="text-xs text-[var(--muted)]">
            {pag.total} transaction{pag.total !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ── Ledger Table ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--muted)]">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Before</th>
                <th className="px-4 py-3 font-medium">After</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">ID</th>
              </tr>
            </thead>
            <tbody>
              {txQ.isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-xs text-[var(--muted)]"
                  >
                    Loading transactions…
                  </td>
                </tr>
              ) : txs.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-xs text-[var(--muted)]"
                  >
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                txs.map((tx) => (
                  <tr
                    key={tx._id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--panel-2)]"
                  >
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          tx.type === "credit"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      {sourceLabel[tx.source] ?? tx.source}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-sm font-semibold ${
                        tx.type === "credit"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "-"}
                      {fmt(tx.amount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          statusColor[tx.status] ??
                          "bg-gray-500/15 text-gray-400"
                        }`}
                      >
                        {tx.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[var(--muted)]">
                      {tx.balanceBefore != null ? fmt(tx.balanceBefore) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[var(--muted)]">
                      {tx.balanceAfter != null ? fmt(tx.balanceAfter) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[var(--muted)]">
                      {tx.provider ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-[var(--muted)]">
                      {tx._id.slice(-8)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {pag && pag.pages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md bg-[var(--panel-2)] px-3 py-1.5 text-xs disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-[var(--muted)]">
              Page {pag.page} of {pag.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pag.pages, p + 1))}
              disabled={page >= pag.pages}
              className="rounded-md bg-[var(--panel-2)] px-3 py-1.5 text-xs disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
