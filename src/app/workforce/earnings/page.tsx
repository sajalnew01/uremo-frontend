"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, ApiError } from "@/lib/api";
import { EP } from "@/lib/api/endpoints";
import { useRequireAuth } from "@/hooks/useAuth";

type EarningsResponse = {
  totalEarnings: number;
  pendingEarnings: number;
  withdrawable: number;
  payRate?: number;
  history: Array<{
    projectId: string;
    title: string;
    amount: number;
    creditedAt?: string;
  }>;
};

export default function WorkforceEarningsPage() {
  const isAuthed = useRequireAuth();
  const qc = useQueryClient();

  const [amount, setAmount] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const earningsQuery = useQuery({
    queryKey: ["workspace", "earnings"],
    queryFn: async () =>
      apiRequest<EarningsResponse>(
        EP.WORKSPACE_EARNINGS,
        "GET",
        undefined,
        true,
      ),
    enabled: Boolean(isAuthed),
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const withdrawAmount = parseFloat(amount);
      if (!withdrawAmount || Number.isNaN(withdrawAmount)) {
        throw new Error("Enter a valid amount");
      }
      return apiRequest<{
        success: boolean;
        message?: string;
        newEarningsBalance?: number;
      }>(EP.WORKSPACE_WITHDRAW, "POST", { amount: withdrawAmount }, true);
    },
    onSuccess: async (data) => {
      setMsg(data.message || "Transfer complete");
      setErr(null);
      setAmount("");
      await qc.invalidateQueries({ queryKey: ["workspace", "earnings"] });
      await qc.invalidateQueries({ queryKey: ["workspace", "profile"] });
    },
    onError: (e) => {
      if (e instanceof ApiError) setErr(e.message);
      else setErr(e instanceof Error ? e.message : "Withdrawal failed");
      setMsg(null);
    },
  });

  if (!isAuthed) return null;

  const data = earningsQuery.data;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Earnings</div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              Earnings summary and transfer-to-wallet.
            </div>
          </div>
          <Link
            href="/workforce"
            className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
          >
            Back
          </Link>
        </div>

        {/* Cross-engine links */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/finance/wallet"
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white"
          >
            → Wallet
          </Link>
          <Link
            href="/finance/transactions"
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white"
          >
            → Transactions
          </Link>
        </div>

        {msg ? (
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm">
            {msg}
          </div>
        ) : null}
        {err ? (
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm">
            {err}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        {earningsQuery.isLoading ? (
          <div className="text-sm text-[var(--muted)]">Loading...</div>
        ) : earningsQuery.isError ? (
          <div className="text-sm text-[var(--muted)]">
            Failed to load earnings.
          </div>
        ) : !data ? (
          <div className="text-sm text-[var(--muted)]">No data.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Total Earnings
                </div>
                <div className="mt-2 text-sm font-semibold">
                  ${data.totalEarnings.toFixed(2)}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Pending
                </div>
                <div className="mt-2 text-sm font-semibold">
                  ${data.pendingEarnings.toFixed(2)}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Withdrawable
                </div>
                <div className="mt-2 text-sm font-semibold">
                  ${data.withdrawable.toFixed(2)}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Pay Rate
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {data.payRate ?? 0}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="text-sm font-semibold">Transfer to Wallet</div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                Moves earnings balance into your wallet. Minimum $1.00.
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="min-w-[200px]">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Amount
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm"
                    placeholder="10.00"
                  />
                </div>

                <button
                  type="button"
                  disabled={withdrawMutation.isPending}
                  onClick={() => {
                    setMsg(null);
                    setErr(null);
                    withdrawMutation.mutate();
                  }}
                  className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {withdrawMutation.isPending ? "Transferring..." : "Transfer"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="text-sm font-semibold">History</div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                Completed projects with credited earnings.
              </div>

              <div className="mt-3 space-y-2">
                {data.history.length === 0 ? (
                  <div className="text-sm text-[var(--muted)]">
                    No history yet.
                  </div>
                ) : (
                  data.history.map((h) => (
                    <div
                      key={h.projectId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2"
                    >
                      <div>
                        <div className="text-sm font-semibold">{h.title}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {h.creditedAt
                            ? new Date(h.creditedAt).toLocaleString()
                            : "—"}
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        ${Number(h.amount || 0).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
