"use client";

import { useRequireAdmin } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";

/* ─── helpers ─── */
const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/* ─── types ─── */
interface FinanceMetrics {
  ok: boolean;
  finance: {
    totalWalletLiabilities: number;
    pendingWithdrawals: number;
    lifetimeEarningsPaid: number;
    purchaseRevenue: number;
    rentalRevenue: number;
    topupTotal: number;
    withdrawalTotal: number;
    refundTotal: number;
    platformRevenue: number;
    transactionBreakdown: Record<string, { count: number; total: number }>;
  };
}

/* ─── page ─── */
export default function AdminFinancePage() {
  const ok = useRequireAdmin();

  const financeQ = useQuery<FinanceMetrics>({
    queryKey: ["admin-finance-metrics"],
    queryFn: () =>
      apiRequest<FinanceMetrics>(
        EP.ADMIN_WALLET_FINANCE,
        "GET",
        undefined,
        true,
      ),
    enabled: ok,
  });

  if (!ok) return null;

  const f = financeQ.data?.finance;
  const breakdown = f?.transactionBreakdown ?? {};
  const breakdownKeys = Object.keys(breakdown).sort();

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="text-sm font-semibold">Finance Dashboard</div>
        <div className="mt-1 text-xs text-[var(--muted)]">
          All metrics derived from the wallet transaction ledger.
        </div>
      </div>

      {financeQ.isLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center text-xs text-[var(--muted)]">
          Loading finance metrics…
        </div>
      ) : !f ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center text-xs text-red-400">
          Failed to load finance data.
        </div>
      ) : (
        <>
          {/* ── Key Metrics ── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: "Platform Revenue",
                value: f.platformRevenue,
                accent:
                  f.platformRevenue >= 0 ? "text-emerald-400" : "text-red-400",
              },
              {
                label: "Total Wallet Liabilities",
                value: f.totalWalletLiabilities,
              },
              { label: "Pending Withdrawals", value: f.pendingWithdrawals },
              {
                label: "Lifetime Earnings Paid",
                value: f.lifetimeEarningsPaid,
              },
            ].map(({ label, value, accent }) => (
              <div
                key={label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
              >
                <div className="text-xs text-[var(--muted)]">{label}</div>
                <div className={`mt-1 text-xl font-bold ${accent ?? ""}`}>
                  {fmt(value)}
                </div>
              </div>
            ))}
          </div>

          {/* ── Revenue Breakdown ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="text-sm font-semibold">Revenue Breakdown</div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Purchase Revenue", value: f.purchaseRevenue },
                { label: "Rental Revenue", value: f.rentalRevenue },
                { label: "Top-Up Total", value: f.topupTotal },
                { label: "Withdrawal Total", value: f.withdrawalTotal },
                { label: "Refund Total", value: f.refundTotal },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-3"
                >
                  <div className="text-[10px] text-[var(--muted)]">{label}</div>
                  <div className="mt-0.5 text-sm font-semibold">
                    {fmt(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Transaction Breakdown by Source ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="text-sm font-semibold">
              Transaction Breakdown (Success Only)
            </div>
            {breakdownKeys.length === 0 ? (
              <div className="mt-3 text-xs text-[var(--muted)]">
                No completed transactions yet.
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs text-[var(--muted)]">
                      <th className="px-3 py-2 font-medium">Source</th>
                      <th className="px-3 py-2 font-medium text-right">
                        Count
                      </th>
                      <th className="px-3 py-2 font-medium text-right">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownKeys.map((key) => (
                      <tr
                        key={key}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="px-3 py-2 text-xs">
                          {key.replace(/_/g, " ")}
                        </td>
                        <td className="px-3 py-2 text-xs text-right text-[var(--muted)]">
                          {breakdown[key].count}
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-semibold">
                          {fmt(breakdown[key].total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Formula ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="text-sm font-semibold">
              Platform Revenue Formula
            </div>
            <div className="mt-2 text-xs text-[var(--muted)] font-mono">
              platformRevenue = purchaseRevenue + rentalRevenue −
              lifetimeEarningsPaid − withdrawalTotal − refundTotal
            </div>
            <div className="mt-1 text-xs text-[var(--muted)] font-mono">
              {fmt(f.platformRevenue)} = {fmt(f.purchaseRevenue)} +{" "}
              {fmt(f.rentalRevenue)} − {fmt(f.lifetimeEarningsPaid)} −{" "}
              {fmt(f.withdrawalTotal)} − {fmt(f.refundTotal)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
