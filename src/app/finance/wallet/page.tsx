"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { WalletBalance, WalletTransaction } from "@/types";

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

/* ─── page ─── */
export default function FinanceWalletPage() {
  const ok = useRequireAuth();
  const qc = useQueryClient();
  const [topupAmount, setTopupAmount] = useState("");
  const [topupError, setTopupError] = useState("");
  const [paypalStatus, setPaypalStatus] = useState("");

  /* ── queries ── */
  const balanceQ = useQuery<WalletBalance>({
    queryKey: ["wallet-balance"],
    queryFn: () =>
      apiRequest<WalletBalance>(EP.WALLET_BALANCE, "GET", undefined, true),
    enabled: ok,
  });

  const pendingQ = useQuery<{
    success: boolean;
    pendingTopups: WalletTransaction[];
  }>({
    queryKey: ["wallet-pending"],
    queryFn: () =>
      apiRequest<{ success: boolean; pendingTopups: WalletTransaction[] }>(
        EP.WALLET_PENDING,
        "GET",
        undefined,
        true,
      ),
    enabled: ok,
  });

  const paypalQ = useQuery<{ success: boolean; available: boolean }>({
    queryKey: ["paypal-available"],
    queryFn: () =>
      apiRequest<{ success: boolean; available: boolean }>(
        EP.WALLET_PAYPAL_AVAILABLE,
        "GET",
        undefined,
        true,
      ),
    enabled: ok,
  });

  /* ── mutations ── */
  const manualTopup = useMutation({
    mutationFn: (amount: number) =>
      apiRequest<{
        success: boolean;
        transactionId: string;
        status: string;
        amount: number;
        currentBalance: number;
      }>(EP.WALLET_TOPUP, "POST", { amount }, true),
    onSuccess: () => {
      setTopupAmount("");
      setTopupError("");
      qc.invalidateQueries({ queryKey: ["wallet-balance"] });
      qc.invalidateQueries({ queryKey: ["wallet-pending"] });
    },
    onError: (err: Error) => setTopupError(err.message),
  });

  const paypalTopup = useMutation({
    mutationFn: async (amount: number) => {
      setPaypalStatus("Creating PayPal order…");
      const res = await apiRequest<{
        success: boolean;
        transactionId: string;
        paypalOrderId: string;
        approvalUrl: string;
        status: string;
        amount: number;
      }>(EP.WALLET_PAYPAL_CREATE, "POST", { amount }, true);
      if (res.approvalUrl) {
        setPaypalStatus("Redirecting to PayPal…");
        window.location.href = res.approvalUrl;
      }
      return res;
    },
    onError: (err: Error) => {
      setPaypalStatus("");
      setTopupError(err.message);
    },
  });

  const cancelTopup = useMutation({
    mutationFn: (transactionId: string) =>
      apiRequest<{ success: boolean; message: string }>(
        EP.WALLET_CANCEL_TOPUP,
        "POST",
        { transactionId },
        true,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet-balance"] });
      qc.invalidateQueries({ queryKey: ["wallet-pending"] });
    },
  });

  /* ── PayPal return handling ── */
  const handlePayPalReturn = useCallback(async () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paypalParam = params.get("paypal");
    const token = params.get("token");
    if (paypalParam === "success" && token) {
      setPaypalStatus("Confirming PayPal payment…");
      try {
        await apiRequest(
          EP.WALLET_PAYPAL_CONFIRM,
          "POST",
          { paypalOrderId: token },
          true,
        );
        setPaypalStatus("Payment confirmed! Awaiting admin verification.");
        qc.invalidateQueries({ queryKey: ["wallet-balance"] });
        qc.invalidateQueries({ queryKey: ["wallet-pending"] });
        // Clean URL
        window.history.replaceState({}, "", "/finance/wallet");
      } catch (err) {
        setPaypalStatus(
          `PayPal confirmation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    } else if (paypalParam === "cancelled") {
      setPaypalStatus("PayPal payment was cancelled.");
      window.history.replaceState({}, "", "/finance/wallet");
    }
  }, [qc]);

  // Run PayPal return handler on mount
  useState(() => {
    handlePayPalReturn();
  });

  const handleTopup = (provider: "manual" | "paypal") => {
    setTopupError("");
    const num = parseFloat(topupAmount);
    if (!num || num < 1) {
      setTopupError("Minimum top-up is $1");
      return;
    }
    if (provider === "paypal") paypalTopup.mutate(num);
    else manualTopup.mutate(num);
  };

  if (!ok) return null;
  const bal = balanceQ.data;
  const pending = pendingQ.data?.pendingTopups ?? [];
  const paypalAvailable = paypalQ.data?.available ?? false;
  const isMutating = manualTopup.isPending || paypalTopup.isPending;

  return (
    <div className="space-y-5">
      {/* ── Cross-engine navigation ── */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/finance/transactions"
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white"
        >
          → Transactions
        </Link>
        <Link
          href="/finance/withdrawals"
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white"
        >
          → Withdrawals
        </Link>
        <Link
          href="/workforce/earnings"
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white"
        >
          → Earnings
        </Link>
        <Link
          href="/marketplace"
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white"
        >
          → Marketplace
        </Link>
      </div>

      {/* ── Balance Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Wallet Balance", value: bal?.balance },
          { label: "Withdrawable", value: bal?.withdrawable },
          { label: "Pending Withdrawals", value: bal?.pendingWithdrawals },
          { label: "Lifetime Earnings", value: bal?.lifetimeEarnings },
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

      {/* ── Top-Up Form ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="text-sm font-semibold">Top Up Wallet</div>
        <div className="mt-1 text-xs text-[var(--muted)]">
          All top-ups require admin verification before crediting.
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">
              Amount (USD)
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="0.00"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              disabled={isMutating}
              className="w-36 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => handleTopup("manual")}
            disabled={isMutating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {manualTopup.isPending ? "Submitting…" : "Manual Top-Up"}
          </button>
          {paypalAvailable && (
            <button
              onClick={() => handleTopup("paypal")}
              disabled={isMutating}
              className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-400 disabled:opacity-50"
            >
              {paypalTopup.isPending ? "Processing…" : "Pay with PayPal"}
            </button>
          )}
        </div>

        {topupError && (
          <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {topupError}
          </div>
        )}
        {manualTopup.isSuccess && (
          <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            Top-up submitted! Waiting for admin verification.
          </div>
        )}
        {paypalStatus && (
          <div className="mt-3 rounded-lg bg-blue-500/10 px-3 py-2 text-xs text-blue-300">
            {paypalStatus}
          </div>
        )}
      </div>

      {/* ── Pending Top-Ups ── */}
      {pending.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="text-sm font-semibold">
            Pending Top-Ups ({pending.length})
          </div>
          <div className="mt-3 space-y-2">
            {pending.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {fmt(tx.amount)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[tx.status] ?? "bg-gray-500/15 text-gray-400"}`}
                  >
                    {tx.status.replace("_", " ")}
                  </span>
                  {tx.provider && tx.provider !== "manual" && (
                    <span className="text-xs text-[var(--muted)]">
                      via {tx.provider}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--muted)]">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </span>
                  {tx.status === "initiated" && (
                    <button
                      onClick={() => cancelTopup.mutate(tx._id)}
                      disabled={cancelTopup.isPending}
                      className="rounded-md bg-red-600/20 px-2 py-1 text-xs text-red-400 hover:bg-red-600/30 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Info ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="text-sm font-semibold">Top-Up Lifecycle</div>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-[var(--muted)]">
          <li>
            <strong>Initiated</strong> — You submit a top-up request.
          </li>
          <li>
            <strong>Paid (Unverified)</strong> — PayPal payment captured but
            awaiting admin review.
          </li>
          <li>
            <strong>Success</strong> — Admin verifies and wallet balance is
            credited.
          </li>
          <li>
            <strong>Failed</strong> — Request cancelled or rejected.
          </li>
        </ol>
      </div>
    </div>
  );
}
