"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { ConfirmModal } from "@/design-system";
import { emitToast } from "@/hooks/useToast";

interface EarningsResponse {
  totalEarnings: number;
  withdrawable: number;
  pendingWithdrawals: number;
  transactions: Array<{
    _id: string;
    amount: number;
    type: string;
    source: string;
    status: string;
    createdAt: string;
  }>;
}

export default function EarningsPage() {
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);

  const { data, isLoading } = useQuery<EarningsResponse>({
    queryKey: ["ws-earnings"],
    queryFn: () => apiRequest(EP.WORKSPACE_EARNINGS, "GET", undefined, true),
  });

  const withdrawMutation = useMutation({
    mutationFn: () =>
      apiRequest(EP.WORKSPACE_WITHDRAW, "POST", { amount: Number(withdrawAmount) }, true),
    onSuccess: () => {
      emitToast("Withdrawal requested!", "success");
      setWithdrawAmount("");
      setShowWithdraw(false);
      queryClient.invalidateQueries({ queryKey: ["ws-earnings"] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: "var(--space-6)" }}>Earnings</h1>

      {/* Stats */}
      <div className="u-grid u-grid-3" style={{ marginBottom: "var(--space-6)" }}>
        <div className="stat-card">
          <div className="stat-card-label">Total Earnings</div>
          <div className="stat-card-value" style={{ color: "var(--color-success)" }}>
            ${data?.totalEarnings?.toFixed(2) || "0.00"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Withdrawable</div>
          <div className="stat-card-value" style={{ color: "var(--color-brand)" }}>
            ${data?.withdrawable?.toFixed(2) || "0.00"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Pending</div>
          <div className="stat-card-value" style={{ color: "var(--color-warning)" }}>
            ${data?.pendingWithdrawals?.toFixed(2) || "0.00"}
          </div>
        </div>
      </div>

      {/* Withdraw */}
      <div className="u-card" style={{ maxWidth: 400, marginBottom: "var(--space-6)" }}>
        <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Withdraw</h3>
        <div className="auth-field">
          <label className="u-label">Amount ($)</label>
          <input
            className="u-input"
            type="number"
            min="1"
            max={data?.withdrawable || 0}
            placeholder="Enter amount"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
        </div>
        <button
          className="u-btn u-btn-primary"
          disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > (data?.withdrawable || 0)}
          onClick={() => setShowWithdraw(true)}
        >
          Request Withdrawal
        </button>
      </div>

      {/* Transaction History */}
      {isLoading ? (
        <div className="page-loading"><div className="u-spinner" /> Loading...</div>
      ) : data?.transactions && data.transactions.length > 0 ? (
        <div className="page-section">
          <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Transaction History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {data.transactions.map((tx) => (
              <div key={tx._id} className="u-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)" }}>
                    {tx.source.replace(/_/g, " ")}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span style={{
                  fontWeight: "var(--weight-bold)",
                  color: tx.type === "credit" ? "var(--color-success)" : "var(--color-error)",
                }}>
                  {tx.type === "credit" ? "+" : "-"}${tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="page-empty">No transactions yet.</div>
      )}

      <ConfirmModal
        open={showWithdraw}
        title="Confirm Withdrawal"
        message={`Withdraw $${withdrawAmount} from your earnings?`}
        onConfirm={() => withdrawMutation.mutateAsync()}
        onCancel={() => setShowWithdraw(false)}
      />
    </div>
  );
}
