"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import {
  MetricsRibbon,
  DataGrid,
  Badge,
  ConfirmModal,
  type Column,
} from "@/design-system";
import { emitToast } from "@/hooks/useToast";

type Tab = "wallet" | "payments" | "withdrawals";

interface WalletStats {
  totalBalance: number;
  totalTopups: number;
  totalWithdrawals: number;
  pendingTopups: number;
  pendingWithdrawals: number;
}

interface PendingTopup {
  _id: string;
  userId: string | { _id: string; name: string; email: string };
  amount: number;
  createdAt: string;
}

interface Withdrawal {
  _id: string;
  userId: string | { _id: string; name: string; email: string };
  amount: number;
  status: string;
  createdAt: string;
}

export default function FinanceEngine() {
  const [tab, setTab] = useState<Tab>("wallet");
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    msg: string;
    fn: () => Promise<unknown>;
  } | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    userId: "",
    amount: "",
    reason: "",
    type: "credit",
  });

  /* ─── QUERIES ─── */
  const { data: stats, isLoading: statsLoading } = useQuery<WalletStats>({
    queryKey: ["admin-wallet-stats"],
    queryFn: () => apiRequest(EP.ADMIN_WALLET_STATS, "GET", undefined, true),
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery<{
    topups: PendingTopup[];
  }>({
    queryKey: ["admin-pending-topups"],
    queryFn: () => apiRequest(EP.ADMIN_WALLET_PENDING, "GET", undefined, true),
    enabled: tab === "wallet",
  });

  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery<{
    withdrawals: Withdrawal[];
  }>({
    queryKey: ["admin-withdrawals"],
    queryFn: () =>
      apiRequest(EP.ADMIN_WALLET_WITHDRAWALS, "GET", undefined, true),
    enabled: tab === "withdrawals",
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<{
    payments: Record<string, unknown>[];
  }>({
    queryKey: ["admin-payments"],
    queryFn: () => apiRequest(EP.ADMIN_PAYMENTS, "GET", undefined, true),
    enabled: tab === "payments",
  });

  const { data: financeData } = useQuery({
    queryKey: ["admin-finance"],
    queryFn: () =>
      apiRequest<{ revenue: number; expenses: number }>(
        EP.ADMIN_WALLET_FINANCE,
        "GET",
        undefined,
        true,
      ),
  });

  /* ─── MUTATIONS ─── */
  const actionMut = useMutation({
    mutationFn: async ({
      url,
      method,
      body,
    }: {
      url: string;
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: unknown;
    }) => apiRequest(url, method, body, true),
    onSuccess: () => {
      emitToast("Action completed", "success");
      queryClient.invalidateQueries({ queryKey: ["admin-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-topups"] });
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      setConfirmAction(null);
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const adjustMut = useMutation({
    mutationFn: () =>
      apiRequest(
        EP.ADMIN_WALLET_ADJUST,
        "POST",
        {
          userId: adjustForm.userId,
          amount: Number(adjustForm.amount),
          reason: adjustForm.reason,
          type: adjustForm.type,
        },
        true,
      ),
    onSuccess: () => {
      emitToast("Balance adjusted", "success");
      setAdjustForm({ userId: "", amount: "", reason: "", type: "credit" });
      queryClient.invalidateQueries({ queryKey: ["admin-wallet-stats"] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  /* ─── METRICS ─── */
  const metrics = [
    {
      label: "Total Balance",
      value: `$${stats?.totalBalance?.toFixed(2) ?? "0"}`,
      color: "var(--color-brand)",
    },
    {
      label: "Total Topups",
      value: `$${stats?.totalTopups?.toFixed(2) ?? "0"}`,
    },
    {
      label: "Total Withdrawals",
      value: `$${stats?.totalWithdrawals?.toFixed(2) ?? "0"}`,
    },
    {
      label: "Pending Topups",
      value: stats?.pendingTopups ?? 0,
      color: "var(--color-warning)",
    },
    {
      label: "Revenue",
      value: `$${financeData?.revenue?.toFixed(2) ?? "0"}`,
      color: "var(--color-success)",
    },
  ];

  /* ─── COLUMNS ─── */
  const getUserName = (u: string | { name: string; email: string }) =>
    typeof u === "string" ? u : `${u.name} (${u.email})`;

  const topupCols: Column<Record<string, unknown>>[] = [
    {
      key: "userId",
      header: "User",
      render: (r) =>
        getUserName(r.userId as string | { name: string; email: string }),
    },
    {
      key: "amount",
      header: "Amount",
      render: (r) => `$${Number(r.amount).toFixed(2)}`,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (r) => new Date(String(r.createdAt)).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <button
          className="u-btn u-btn-primary u-btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmAction({
              title: "Verify Topup",
              msg: `Verify $${Number(r.amount).toFixed(2)} topup?`,
              fn: () =>
                actionMut.mutateAsync({
                  url: EP.ADMIN_WALLET_VERIFY,
                  method: "POST",
                  body: { topupId: r._id },
                }),
            });
          }}
        >
          Verify
        </button>
      ),
    },
  ];

  const withdrawalCols: Column<Record<string, unknown>>[] = [
    {
      key: "userId",
      header: "User",
      render: (r) =>
        getUserName(r.userId as string | { name: string; email: string }),
    },
    {
      key: "amount",
      header: "Amount",
      render: (r) => `$${Number(r.amount).toFixed(2)}`,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge status={String(r.status)} />,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (r) => new Date(String(r.createdAt)).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          {r.status === "pending" && (
            <>
              <button
                className="u-btn u-btn-primary u-btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmAction({
                    title: "Approve",
                    msg: "Approve withdrawal?",
                    fn: () =>
                      actionMut.mutateAsync({
                        url: EP.ADMIN_WALLET_WITHDRAWAL_APPROVE(String(r._id)),
                        method: "PUT",
                      }),
                  });
                }}
              >
                Approve
              </button>
              <button
                className="u-btn u-btn-danger u-btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmAction({
                    title: "Reject",
                    msg: "Reject withdrawal?",
                    fn: () =>
                      actionMut.mutateAsync({
                        url: EP.ADMIN_WALLET_WITHDRAWAL_REJECT(String(r._id)),
                        method: "PUT",
                      }),
                  });
                }}
              >
                Reject
              </button>
            </>
          )}
          {r.status === "approved" && (
            <button
              className="u-btn u-btn-primary u-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmAction({
                  title: "Mark Paid",
                  msg: "Mark as paid?",
                  fn: () =>
                    actionMut.mutateAsync({
                      url: EP.ADMIN_WALLET_WITHDRAWAL_PAY(String(r._id)),
                      method: "PUT",
                    }),
                });
              }}
            >
              Pay
            </button>
          )}
        </div>
      ),
    },
  ];

  const paymentCols: Column<Record<string, unknown>>[] = [
    { key: "_id", header: "ID", render: (r) => String(r._id).slice(-8) },
    {
      key: "amount",
      header: "Amount",
      render: (r) => `$${Number(r.amount || 0).toFixed(2)}`,
    },
    { key: "method", header: "Method" },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge status={String(r.status)} />,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (r) => new Date(String(r.createdAt)).toLocaleDateString(),
    },
  ];

  return (
    <div style={{ padding: "var(--space-5)" }}>
      <h1 className="u-heading-1" style={{ marginBottom: "var(--space-4)" }}>
        Finance Engine
      </h1>

      <MetricsRibbon metrics={metrics} loading={statsLoading} />

      <div className="tab-bar" style={{ marginTop: "var(--space-4)" }}>
        {(["wallet", "payments", "withdrawals"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab-bar-item ${tab === t ? "tab-bar-item--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        {tab === "wallet" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-5)",
            }}
          >
            <div>
              <h3
                className="u-heading-3"
                style={{ marginBottom: "var(--space-3)" }}
              >
                Pending Topups
              </h3>
              <DataGrid
                columns={topupCols}
                data={
                  (pendingData?.topups ?? []) as unknown as Record<
                    string,
                    unknown
                  >[]
                }
                loading={pendingLoading}
                emptyMessage="No pending topups"
                rowKey={(r) => String(r._id)}
              />
            </div>

            {/* Manual Adjust */}
            <div className="u-card" style={{ maxWidth: 500 }}>
              <h3
                className="u-heading-3"
                style={{ marginBottom: "var(--space-3)" }}
              >
                Manual Balance Adjust
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                <div className="auth-field">
                  <label className="u-label">User ID</label>
                  <input
                    className="u-input"
                    placeholder="User ID"
                    value={adjustForm.userId}
                    onChange={(e) =>
                      setAdjustForm((f) => ({ ...f, userId: e.target.value }))
                    }
                  />
                </div>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  <div className="auth-field" style={{ flex: 1 }}>
                    <label className="u-label">Amount</label>
                    <input
                      className="u-input"
                      type="number"
                      placeholder="Amount"
                      value={adjustForm.amount}
                      onChange={(e) =>
                        setAdjustForm((f) => ({ ...f, amount: e.target.value }))
                      }
                    />
                  </div>
                  <div className="auth-field" style={{ flex: 1 }}>
                    <label className="u-label">Type</label>
                    <select
                      className="u-input"
                      value={adjustForm.type}
                      onChange={(e) =>
                        setAdjustForm((f) => ({ ...f, type: e.target.value }))
                      }
                    >
                      <option value="credit">Credit</option>
                      <option value="debit">Debit</option>
                    </select>
                  </div>
                </div>
                <div className="auth-field">
                  <label className="u-label">Reason</label>
                  <input
                    className="u-input"
                    placeholder="Reason"
                    value={adjustForm.reason}
                    onChange={(e) =>
                      setAdjustForm((f) => ({ ...f, reason: e.target.value }))
                    }
                  />
                </div>
                <button
                  className="u-btn u-btn-primary"
                  disabled={
                    !adjustForm.userId ||
                    !adjustForm.amount ||
                    adjustMut.isPending
                  }
                  onClick={() => adjustMut.mutate()}
                >
                  {adjustMut.isPending ? "Adjusting..." : "Adjust Balance"}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "payments" && (
          <DataGrid
            columns={paymentCols}
            data={
              (paymentsData?.payments ?? []) as unknown as Record<
                string,
                unknown
              >[]
            }
            loading={paymentsLoading}
            emptyMessage="No payments"
            rowKey={(r) => String(r._id)}
          />
        )}

        {tab === "withdrawals" && (
          <DataGrid
            columns={withdrawalCols}
            data={
              (withdrawalsData?.withdrawals ?? []) as unknown as Record<
                string,
                unknown
              >[]
            }
            loading={withdrawalsLoading}
            emptyMessage="No withdrawals"
            rowKey={(r) => String(r._id)}
          />
        )}
      </div>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title ?? ""}
        message={confirmAction?.msg ?? ""}
        onConfirm={() => confirmAction?.fn() ?? Promise.resolve()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
