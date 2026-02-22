"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequireAdmin } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { WalletTransaction, WithdrawalRequest } from "@/types";

/* ─── helpers ─── */
const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const statusColor: Record<string, string> = {
  initiated: "bg-yellow-500/15 text-yellow-400",
  pending: "bg-blue-500/15 text-blue-400",
  paid_unverified: "bg-orange-500/15 text-orange-300",
  success: "bg-emerald-500/15 text-emerald-400",
  failed: "bg-red-500/15 text-red-400",
  approved: "bg-blue-500/15 text-blue-400",
  paid: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
};

type Tab = "topups" | "withdrawals" | "users";

/* ─── stat types ─── */
interface WalletStats {
  success: boolean;
  stats: {
    totalBalance: number;
    credits: { total: number; count: number };
    debits: { total: number; count: number };
    userCounts: { low: number; medium: number; high: number; total: number };
  };
}

interface PendingTopupsResponse {
  success: boolean;
  pendingTopups: (WalletTransaction & {
    user: { _id: string; name: string; email: string };
  })[];
  total: number;
  page: number;
  pages: number;
}

interface AdminWithdrawalsResponse {
  success: boolean;
  withdrawals: WithdrawalRequest[];
}

interface AdminUsersResponse {
  success: boolean;
  users: {
    _id: string;
    name: string;
    email: string;
    walletBalance: number;
    createdAt: string;
  }[];
  total: number;
  page: number;
  pages: number;
}

/* ─── page ─── */
export default function AdminWalletPage() {
  const ok = useRequireAdmin();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("topups");
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [wdFilter, setWdFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [balanceLevel, setBalanceLevel] = useState("all");

  /* ── queries ── */
  const statsQ = useQuery<WalletStats>({
    queryKey: ["admin-wallet-stats"],
    queryFn: () =>
      apiRequest<WalletStats>(EP.ADMIN_WALLET_STATS, "GET", undefined, true),
    enabled: ok,
  });

  const pendingQ = useQuery<PendingTopupsResponse>({
    queryKey: ["admin-pending-topups"],
    queryFn: () =>
      apiRequest<PendingTopupsResponse>(
        EP.ADMIN_WALLET_PENDING,
        "GET",
        undefined,
        true,
      ),
    enabled: ok && tab === "topups",
  });

  const wdQ = useQuery<AdminWithdrawalsResponse>({
    queryKey: ["admin-withdrawals", wdFilter],
    queryFn: () =>
      apiRequest<AdminWithdrawalsResponse>(
        `${EP.ADMIN_WALLET_WITHDRAWALS}${wdFilter ? `?status=${wdFilter}` : ""}`,
        "GET",
        undefined,
        true,
      ),
    enabled: ok && tab === "withdrawals",
  });

  const usersQ = useQuery<AdminUsersResponse>({
    queryKey: ["admin-wallet-users", userPage, balanceLevel, userSearch],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(userPage),
        limit: "20",
      });
      if (balanceLevel !== "all") params.set("balanceLevel", balanceLevel);
      if (userSearch.trim()) params.set("search", userSearch.trim());
      return apiRequest<AdminUsersResponse>(
        `${EP.ADMIN_WALLET_USERS}?${params.toString()}`,
        "GET",
        undefined,
        true,
      );
    },
    enabled: ok && tab === "users",
  });

  /* ── topup mutations ── */
  const verifyTopup = useMutation({
    mutationFn: ({
      transactionId,
      action,
      reason,
    }: {
      transactionId: string;
      action: "approve" | "reject";
      reason?: string;
    }) =>
      apiRequest(
        EP.ADMIN_WALLET_VERIFY,
        "POST",
        { transactionId, action, reason },
        true,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pending-topups"] });
      qc.invalidateQueries({ queryKey: ["admin-wallet-stats"] });
    },
  });

  /* ── withdrawal mutations ── */
  const approveWd = useMutation({
    mutationFn: (id: string) =>
      apiRequest(
        EP.ADMIN_WALLET_WITHDRAWAL_APPROVE(id),
        "PUT",
        undefined,
        true,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-withdrawals"] }),
  });

  const payWd = useMutation({
    mutationFn: (id: string) =>
      apiRequest(EP.ADMIN_WALLET_WITHDRAWAL_PAY(id), "PUT", undefined, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      qc.invalidateQueries({ queryKey: ["admin-wallet-stats"] });
    },
  });

  const rejectWd = useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote: string }) =>
      apiRequest(
        EP.ADMIN_WALLET_WITHDRAWAL_REJECT(id),
        "PUT",
        { adminNote },
        true,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-withdrawals"] }),
  });

  if (!ok) return null;
  const stats = statsQ.data?.stats;

  return (
    <div className="space-y-5">
      {/* ── Stats Overview ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Platform Balance", value: stats?.totalBalance },
          {
            label: "Total Credits",
            value: stats?.credits.total,
            sub: `${stats?.credits.count ?? 0} txns`,
          },
          {
            label: "Total Debits",
            value: stats?.debits.total,
            sub: `${stats?.debits.count ?? 0} txns`,
          },
          {
            label: "Total Users",
            value: undefined,
            raw: stats?.userCounts.total?.toString() ?? "…",
          },
        ].map(({ label, value, sub, raw }) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
          >
            <div className="text-xs text-[var(--muted)]">{label}</div>
            <div className="mt-1 text-xl font-bold">
              {raw ?? (value != null ? fmt(value) : "…")}
            </div>
            {sub && (
              <div className="text-[10px] text-[var(--muted)]">{sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-xl bg-[var(--panel-2)] p-1">
        {(["topups", "withdrawals", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? "bg-[var(--panel)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            {t === "topups"
              ? "Pending Top-Ups"
              : t === "withdrawals"
                ? "Withdrawals"
                : "Users"}
          </button>
        ))}
      </div>

      {/* ── Pending Top-Ups ── */}
      {tab === "topups" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="text-sm font-semibold">
            Pending Top-Up Requests ({pendingQ.data?.total ?? 0})
          </div>
          {pendingQ.isLoading ? (
            <div className="mt-4 text-xs text-[var(--muted)]">Loading…</div>
          ) : !pendingQ.data?.pendingTopups?.length ? (
            <div className="mt-4 text-xs text-[var(--muted)]">
              No pending top-up requests.
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {pendingQ.data.pendingTopups.map((tx) => {
                const user = tx.user as {
                  _id: string;
                  name: string;
                  email: string;
                };
                return (
                  <div
                    key={tx._id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">
                          {fmt(tx.amount)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            statusColor[tx.status] ?? ""
                          }`}
                        >
                          {tx.status.replace(/_/g, " ")}
                        </span>
                        {tx.provider && (
                          <span className="text-xs text-[var(--muted)]">
                            via {tx.provider}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--muted)]">
                        {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {user?.name ?? "Unknown"} ({user?.email ?? "—"})
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-[var(--muted)]">
                      TX: {tx._id}
                    </div>

                    {/* actions */}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() =>
                          verifyTopup.mutate({
                            transactionId: tx._id,
                            action: "approve",
                          })
                        }
                        disabled={verifyTopup.isPending}
                        className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <input
                        type="text"
                        placeholder="Rejection reason"
                        value={rejectReason[tx._id] ?? ""}
                        onChange={(e) =>
                          setRejectReason((r) => ({
                            ...r,
                            [tx._id]: e.target.value,
                          }))
                        }
                        className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() =>
                          verifyTopup.mutate({
                            transactionId: tx._id,
                            action: "reject",
                            reason: rejectReason[tx._id] || "Rejected by admin",
                          })
                        }
                        disabled={verifyTopup.isPending}
                        className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Withdrawals ── */}
      {tab === "withdrawals" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Withdrawal Requests</div>
            <select
              value={wdFilter}
              onChange={(e) => setWdFilter(e.target.value)}
              className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {wdQ.isLoading ? (
            <div className="mt-4 text-xs text-[var(--muted)]">Loading…</div>
          ) : !wdQ.data?.withdrawals?.length ? (
            <div className="mt-4 text-xs text-[var(--muted)]">
              No withdrawal requests found.
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {wdQ.data.withdrawals.map((wd) => {
                const user = typeof wd.userId === "object" ? wd.userId : null;
                return (
                  <div
                    key={wd._id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">
                          {fmt(wd.amount)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            statusColor[wd.status] ?? ""
                          }`}
                        >
                          {wd.status}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--muted)]">
                        {new Date(wd.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {user && (
                      <div className="mt-1 text-xs text-[var(--muted)]">
                        {user.name} ({user.email})
                        {typeof user.walletBalance === "number" &&
                          ` • Balance: ${fmt(user.walletBalance)}`}
                      </div>
                    )}
                    {wd.adminNote && (
                      <div className="mt-1 text-xs text-orange-400">
                        Note: {wd.adminNote}
                      </div>
                    )}
                    <div className="mt-1 font-mono text-[10px] text-[var(--muted)]">
                      ID: {wd._id}
                    </div>

                    {/* actions */}
                    <div className="mt-3 flex items-center gap-2">
                      {wd.status === "pending" && (
                        <>
                          <button
                            onClick={() => approveWd.mutate(wd._id)}
                            disabled={approveWd.isPending}
                            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <input
                            type="text"
                            placeholder="Rejection note"
                            value={rejectReason[wd._id] ?? ""}
                            onChange={(e) =>
                              setRejectReason((r) => ({
                                ...r,
                                [wd._id]: e.target.value,
                              }))
                            }
                            className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs"
                          />
                          <button
                            onClick={() =>
                              rejectWd.mutate({
                                id: wd._id,
                                adminNote:
                                  rejectReason[wd._id] || "Rejected by admin",
                              })
                            }
                            disabled={rejectWd.isPending}
                            className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {wd.status === "approved" && (
                        <button
                          onClick={() => payWd.mutate(wd._id)}
                          disabled={payWd.isPending}
                          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {payWd.isPending ? "Processing…" : "Mark as Paid"}
                        </button>
                      )}
                      {(wd.status === "paid" || wd.status === "rejected") && (
                        <span className="text-xs text-[var(--muted)]">
                          No actions available
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Users ── */}
      {tab === "users" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="text-sm font-semibold">Wallet Users</div>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="text"
              placeholder="Search name or email…"
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(1);
              }}
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs"
            />
            <select
              value={balanceLevel}
              onChange={(e) => {
                setBalanceLevel(e.target.value);
                setUserPage(1);
              }}
              className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-xs"
            >
              <option value="all">All Balances</option>
              <option value="low">Low (0-50)</option>
              <option value="medium">Medium (51-300)</option>
              <option value="high">High (300+)</option>
            </select>
          </div>

          {usersQ.isLoading ? (
            <div className="mt-4 text-xs text-[var(--muted)]">Loading…</div>
          ) : !usersQ.data?.users?.length ? (
            <div className="mt-4 text-xs text-[var(--muted)]">
              No users found.
            </div>
          ) : (
            <>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-xs text-[var(--muted)]">
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">Balance</th>
                      <th className="px-3 py-2 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersQ.data.users.map((u) => (
                      <tr
                        key={u._id}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="px-3 py-2 text-xs">{u.name}</td>
                        <td className="px-3 py-2 text-xs text-[var(--muted)]">
                          {u.email}
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold">
                          {fmt(u.walletBalance)}
                        </td>
                        <td className="px-3 py-2 text-xs text-[var(--muted)]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {usersQ.data.pages > 1 && (
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    disabled={userPage <= 1}
                    className="rounded-md bg-[var(--panel-2)] px-3 py-1 text-xs disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-[var(--muted)]">
                    Page {usersQ.data.page} of {usersQ.data.pages} (
                    {usersQ.data.total} users)
                  </span>
                  <button
                    onClick={() =>
                      setUserPage((p) => Math.min(usersQ.data!.pages, p + 1))
                    }
                    disabled={userPage >= usersQ.data.pages}
                    className="rounded-md bg-[var(--panel-2)] px-3 py-1 text-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
