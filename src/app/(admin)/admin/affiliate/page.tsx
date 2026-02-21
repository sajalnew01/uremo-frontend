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

type Tab = "affiliates" | "transactions" | "withdrawals";

export default function AffiliateEngine() {
  const [tab, setTab] = useState<Tab>("affiliates");
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    msg: string;
    fn: () => Promise<unknown>;
  } | null>(null);

  /* ─── QUERIES ─── */
  const { data: affiliatesData, isLoading: affiliatesLoading } = useQuery({
    queryKey: ["admin-affiliates"],
    queryFn: () =>
      apiRequest<{ affiliates: Record<string, unknown>[] }>(
        EP.ADMIN_AFFILIATE_LIST,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "affiliates",
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["admin-affiliate-transactions"],
    queryFn: () =>
      apiRequest<{ transactions: Record<string, unknown>[] }>(
        EP.ADMIN_AFFILIATE_TRANSACTIONS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "transactions",
  });

  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["admin-affiliate-withdrawals"],
    queryFn: () =>
      apiRequest<{ withdrawals: Record<string, unknown>[] }>(
        EP.ADMIN_AFFILIATE_WITHDRAWALS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "withdrawals",
  });

  const actionMut = useMutation({
    mutationFn: async ({
      url,
      method,
    }: {
      url: string;
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    }) => apiRequest(url, method, undefined, true),
    onSuccess: () => {
      emitToast("Action completed", "success");
      queryClient.invalidateQueries({
        queryKey: ["admin-affiliate-withdrawals"],
      });
      setConfirmAction(null);
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const metrics = [
    { label: "Affiliates", value: affiliatesData?.affiliates?.length ?? "—" },
    {
      label: "Transactions",
      value: transactionsData?.transactions?.length ?? "—",
    },
    {
      label: "Pending Withdrawals",
      value:
        withdrawalsData?.withdrawals?.filter((w) => w.status === "pending")
          .length ?? 0,
      color: "var(--color-warning)",
    },
  ];

  const affiliateCols: Column<Record<string, unknown>>[] = [
    {
      key: "user",
      header: "User",
      render: (r) => {
        const u = r.userId as Record<string, unknown> | undefined;
        return u?.name ? String(u.name) : String(r.userId || "—");
      },
    },
    { key: "referralCode", header: "Code" },
    {
      key: "referrals",
      header: "Referrals",
      render: (r) => {
        const refs = r.referrals as unknown[] | undefined;
        return refs?.length ?? 0;
      },
    },
    {
      key: "totalEarnings",
      header: "Earnings",
      render: (r) => `$${Number(r.totalEarnings || 0).toFixed(2)}`,
    },
    {
      key: "balance",
      header: "Balance",
      render: (r) => `$${Number(r.balance || 0).toFixed(2)}`,
    },
  ];

  const transactionCols: Column<Record<string, unknown>>[] = [
    { key: "_id", header: "ID", render: (r) => String(r._id).slice(-8) },
    {
      key: "type",
      header: "Type",
      render: (r) => <Badge status={String(r.type)} />,
    },
    {
      key: "amount",
      header: "Amount",
      render: (r) => `$${Number(r.amount || 0).toFixed(2)}`,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (r) => new Date(String(r.createdAt)).toLocaleDateString(),
    },
  ];

  const withdrawalCols: Column<Record<string, unknown>>[] = [
    {
      key: "user",
      header: "User",
      render: (r) => {
        const u = r.userId as Record<string, unknown> | undefined;
        return u?.name ? String(u.name) : String(r.userId || "—");
      },
    },
    {
      key: "amount",
      header: "Amount",
      render: (r) => `$${Number(r.amount || 0).toFixed(2)}`,
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
      header: "",
      render: (r) =>
        r.status === "pending" ? (
          <div style={{ display: "flex", gap: "var(--space-1)" }}>
            <button
              className="u-btn u-btn-primary u-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmAction({
                  title: "Approve",
                  msg: `Approve $${Number(r.amount).toFixed(2)} withdrawal?`,
                  fn: () =>
                    actionMut.mutateAsync({
                      url: EP.ADMIN_AFFILIATE_WITHDRAWAL_APPROVE(String(r._id)),
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
                  msg: "Reject this withdrawal?",
                  fn: () =>
                    actionMut.mutateAsync({
                      url: EP.ADMIN_AFFILIATE_WITHDRAWAL_REJECT(String(r._id)),
                      method: "PUT",
                    }),
                });
              }}
            >
              Reject
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div style={{ padding: "var(--space-5)" }}>
      <h1 className="u-heading-1" style={{ marginBottom: "var(--space-4)" }}>
        Affiliate Engine
      </h1>

      <MetricsRibbon metrics={metrics} loading={affiliatesLoading} />

      <div className="tab-bar" style={{ marginTop: "var(--space-4)" }}>
        {(["affiliates", "transactions", "withdrawals"] as Tab[]).map((t) => (
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
        {tab === "affiliates" && (
          <DataGrid
            columns={affiliateCols}
            data={
              (affiliatesData?.affiliates ?? []) as Record<string, unknown>[]
            }
            loading={affiliatesLoading}
            rowKey={(r) => String(r._id)}
          />
        )}
        {tab === "transactions" && (
          <DataGrid
            columns={transactionCols}
            data={
              (transactionsData?.transactions ?? []) as Record<
                string,
                unknown
              >[]
            }
            loading={transactionsLoading}
            rowKey={(r) => String(r._id)}
          />
        )}
        {tab === "withdrawals" && (
          <DataGrid
            columns={withdrawalCols}
            data={
              (withdrawalsData?.withdrawals ?? []) as Record<string, unknown>[]
            }
            loading={withdrawalsLoading}
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
