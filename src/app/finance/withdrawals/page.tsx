"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { WalletBalance, WithdrawalRequest } from "@/types";

/* ─── helpers ─── */
const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  approved: "bg-blue-500/15 text-blue-400",
  paid: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
};

const statusLabel: Record<string, string> = {
  pending: "Pending Review",
  approved: "Approved — Awaiting Payout",
  paid: "Paid Out",
  rejected: "Rejected",
};

/* ─── page ─── */
export default function FinanceWithdrawalsPage() {
  const ok = useRequireAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  /* ── queries ── */
  const balanceQ = useQuery<WalletBalance>({
    queryKey: ["wallet-balance"],
    queryFn: () =>
      apiRequest<WalletBalance>(EP.WALLET_BALANCE, "GET", undefined, true),
    enabled: ok,
  });

  const wdQ = useQuery<{ success: boolean; withdrawals: WithdrawalRequest[] }>({
    queryKey: ["my-withdrawals"],
    queryFn: () =>
      apiRequest<{ success: boolean; withdrawals: WithdrawalRequest[] }>(
        EP.WALLET_WITHDRAWALS,
        "GET",
        undefined,
        true,
      ),
    enabled: ok,
  });

  /* ── mutation ── */
  const requestWd = useMutation({
    mutationFn: (amt: number) =>
      apiRequest<{
        success: boolean;
        message: string;
        withdrawal: { _id: string; amount: number; status: string };
        withdrawable: number;
        pendingWithdrawals: number;
      }>(EP.WALLET_WITHDRAW, "POST", { amount: amt }, true),
    onSuccess: () => {
      setAmount("");
      setError("");
      qc.invalidateQueries({ queryKey: ["wallet-balance"] });
      qc.invalidateQueries({ queryKey: ["my-withdrawals"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = () => {
    setError("");
    const num = parseFloat(amount);
    if (!num || num < 10) {
      setError("Minimum withdrawal is $10");
      return;
    }
    const avail = balanceQ.data?.withdrawable ?? 0;
    if (num > avail) {
      setError(`Insufficient withdrawable balance. Available: ${fmt(avail)}`);
      return;
    }
    requestWd.mutate(num);
  };

  if (!ok) return null;
  const bal = balanceQ.data;
  const withdrawals = wdQ.data?.withdrawals ?? [];
  const hasPending = withdrawals.some(
    (w) => w.status === "pending" || w.status === "approved",
  );

  return (
    <div className="space-y-5">
      {/* ── Balance Summary ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Withdrawable", value: bal?.withdrawable },
          { label: "Pending Withdrawals", value: bal?.pendingWithdrawals },
          { label: "Wallet Balance", value: bal?.balance },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
          >
            <div className="text-xs text-[var(--muted)]">{label}</div>
            <div className="mt-1 text-xl font-bold">
              {balanceQ.isLoading ? "…" : value != null ? fmt(value) : "—"}
            </div>
          </div>
        ))}
      </div>

      {/* ── Request Withdrawal ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="text-sm font-semibold">Request Withdrawal</div>
        <div className="mt-1 text-xs text-[var(--muted)]">
          Minimum $10. Funds are locked until admin processes payout.
        </div>

        <div className="mt-4 flex items-end gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">
              Amount (USD)
            </label>
            <input
              type="number"
              min="10"
              step="0.01"
              placeholder="10.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={requestWd.isPending}
              className="w-36 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={requestWd.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {requestWd.isPending ? "Submitting…" : "Request Withdrawal"}
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
        {requestWd.isSuccess && (
          <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            Withdrawal request submitted! It will be reviewed by an admin.
          </div>
        )}
        {hasPending && (
          <div className="mt-3 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
            You have active withdrawal requests. Balance is locked until
            processed.
          </div>
        )}
      </div>

      {/* ── Withdrawal History ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="text-sm font-semibold">Withdrawal History</div>

        {wdQ.isLoading ? (
          <div className="mt-4 text-xs text-[var(--muted)]">Loading…</div>
        ) : withdrawals.length === 0 ? (
          <div className="mt-4 text-xs text-[var(--muted)]">
            No withdrawal requests yet.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {withdrawals.map((wd) => (
              <div
                key={wd._id}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {fmt(wd.amount)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      statusColor[wd.status] ?? "bg-gray-500/15 text-gray-400"
                    }`}
                  >
                    {wd.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--muted)]">
                    {statusLabel[wd.status] ?? wd.status}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {new Date(wd.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Lifecycle ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="text-sm font-semibold">Withdrawal Lifecycle</div>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-[var(--muted)]">
          <li>
            <strong>Pending</strong> — Request submitted. Withdrawable balance
            locked.
          </li>
          <li>
            <strong>Approved</strong> — Admin approved. Awaiting payout
            processing.
          </li>
          <li>
            <strong>Paid</strong> — Payout sent. Wallet balance deducted.
          </li>
          <li>
            <strong>Rejected</strong> — Admin rejected. Locked funds restored to
            withdrawable.
          </li>
        </ol>
      </div>
    </div>
  );
}
