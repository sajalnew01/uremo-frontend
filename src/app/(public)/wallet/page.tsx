"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { useRequireAuth } from "@/hooks/useAuth";
import { WalletTransactionTable, ConfirmModal } from "@/design-system";
import { emitToast } from "@/hooks/useToast";
import type { WalletBalance, WalletTransaction } from "@/types";

export default function WalletPage() {
  const ready = useRequireAuth();
  const queryClient = useQueryClient();
  const [topupAmount, setTopupAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showTopup, setShowTopup] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "topup" | "withdraw">("transactions");

  const { data: wallet } = useQuery<WalletBalance>({
    queryKey: ["wallet-balance"],
    queryFn: () => apiRequest(EP.WALLET_BALANCE, "GET", undefined, true),
    enabled: ready,
  });

  const { data: txData } = useQuery<{ transactions: WalletTransaction[] }>({
    queryKey: ["wallet-transactions"],
    queryFn: () => apiRequest(EP.WALLET_TRANSACTIONS, "GET", undefined, true),
    enabled: ready,
  });

  const { data: paymentMethods } = useQuery<{ paymentMethods: Array<{ _id: string; name: string; type: string; details: string; instructions?: string }> }>({
    queryKey: ["payment-methods-public"],
    queryFn: () => apiRequest(EP.PAYMENT_METHODS_PUBLIC),
    enabled: ready,
  });

  const topupMutation = useMutation({
    mutationFn: (data: { amount: number; paymentMethod?: string }) =>
      apiRequest(EP.WALLET_TOPUP, "POST", data, true),
    onSuccess: () => {
      emitToast("Top-up initiated! Upload proof after payment.", "success");
      setTopupAmount("");
      setShowTopup(false);
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) =>
      apiRequest(EP.WALLET_WITHDRAW, "POST", { amount }, true),
    onSuccess: () => {
      emitToast("Withdrawal request submitted!", "success");
      setWithdrawAmount("");
      setShowWithdraw(false);
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  if (!ready) return null;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Wallet</h1>
        <p className="page-subtitle">Manage your balance, top-ups, and withdrawals.</p>
      </div>

      {/* Balance Cards */}
      <div className="u-grid u-grid-4" style={{ marginBottom: "var(--space-8)" }}>
        <div className="stat-card">
          <div className="stat-card-label">Balance</div>
          <div className="stat-card-value" style={{ color: "var(--color-brand)" }}>
            ${wallet?.balance?.toFixed(2) || "0.00"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Withdrawable</div>
          <div className="stat-card-value" style={{ color: "var(--color-success)" }}>
            ${wallet?.withdrawable?.toFixed(2) || "0.00"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Pending Withdrawals</div>
          <div className="stat-card-value" style={{ color: "var(--color-warning)" }}>
            ${wallet?.pendingWithdrawals?.toFixed(2) || "0.00"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Lifetime Earnings</div>
          <div className="stat-card-value">${wallet?.lifetimeEarnings?.toFixed(2) || "0.00"}</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        <button className="u-btn u-btn-primary" onClick={() => setActiveTab("topup")}>Top Up</button>
        <button className="u-btn u-btn-secondary" onClick={() => setActiveTab("withdraw")}>Withdraw</button>
        <button className={`u-btn ${activeTab === "transactions" ? "u-btn-primary" : "u-btn-ghost"}`} onClick={() => setActiveTab("transactions")}>
          Transactions
        </button>
      </div>

      {/* Top Up Form */}
      {activeTab === "topup" && (
        <div className="u-card" style={{ maxWidth: 500, marginBottom: "var(--space-6)" }}>
          <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Top Up Wallet</h3>
          <div className="auth-field">
            <label className="u-label">Amount ($)</label>
            <input
              className="u-input"
              type="number"
              min="1"
              placeholder="Enter amount"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
            />
          </div>

          {paymentMethods?.paymentMethods && paymentMethods.paymentMethods.length > 0 && (
            <div style={{ marginBottom: "var(--space-4)" }}>
              <label className="u-label">Payment Methods</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {paymentMethods.paymentMethods.map((pm) => (
                  <div key={pm._id} className="u-panel" style={{ fontSize: "var(--text-sm)" }}>
                    <div style={{ fontWeight: "var(--weight-semibold)" }}>{pm.name}</div>
                    <div style={{ color: "var(--color-text-secondary)" }}>{pm.details}</div>
                    {pm.instructions && (
                      <div style={{ color: "var(--color-text-tertiary)", fontSize: "var(--text-xs)", marginTop: "var(--space-1)" }}>{pm.instructions}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="u-btn u-btn-primary"
            disabled={!topupAmount || Number(topupAmount) <= 0}
            onClick={() => setShowTopup(true)}
          >
            Initiate Top-Up
          </button>
        </div>
      )}

      {/* Withdraw Form */}
      {activeTab === "withdraw" && (
        <div className="u-card" style={{ maxWidth: 500, marginBottom: "var(--space-6)" }}>
          <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Withdraw Funds</h3>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
            Available: ${wallet?.withdrawable?.toFixed(2) || "0.00"}
          </p>
          <div className="auth-field">
            <label className="u-label">Amount ($)</label>
            <input
              className="u-input"
              type="number"
              min="1"
              max={wallet?.withdrawable || 0}
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
          </div>
          <button
            className="u-btn u-btn-primary"
            disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > (wallet?.withdrawable || 0)}
            onClick={() => setShowWithdraw(true)}
          >
            Request Withdrawal
          </button>
        </div>
      )}

      {/* Transactions */}
      {activeTab === "transactions" && (
        <div className="page-section">
          <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Transaction History</h3>
          <WalletTransactionTable transactions={txData?.transactions || []} />
        </div>
      )}

      <ConfirmModal
        open={showTopup}
        title="Confirm Top-Up"
        message={`Initiate a top-up of $${topupAmount}? Follow the payment instructions and upload proof.`}
        onConfirm={() => topupMutation.mutateAsync({ amount: Number(topupAmount) })}
        onCancel={() => setShowTopup(false)}
      />

      <ConfirmModal
        open={showWithdraw}
        title="Confirm Withdrawal"
        message={`Withdraw $${withdrawAmount} from your wallet?`}
        onConfirm={() => withdrawMutation.mutateAsync(Number(withdrawAmount))}
        onCancel={() => setShowWithdraw(false)}
      />
    </div>
  );
}
