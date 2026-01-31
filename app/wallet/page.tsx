"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

interface Transaction {
  _id: string;
  type: "credit" | "debit";
  amount: number;
  source: string;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

export default function WalletPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { ready, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [ready, isAuthenticated, router]);

  const fetchData = async () => {
    try {
      const [balanceRes, txRes] = await Promise.all([
        apiRequest("/api/wallet/balance", "GET"),
        apiRequest("/api/wallet/transactions", "GET"),
      ]);
      setBalance(balanceRes.balance || 0);
      setTransactions(txRes.transactions || []);
    } catch (err: any) {
      toast(err.message || "Failed to load wallet", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount < 1) {
      toast("Minimum top-up amount is $1", "error");
      return;
    }

    setTopUpLoading(true);
    try {
      const res = await apiRequest("/api/wallet/topup", "POST", { amount });
      toast(res.message || "Balance added!", "success");
      setBalance(res.balance || 0);
      setShowTopUp(false);
      setTopUpAmount("");
      fetchData(); // Refresh transactions
    } catch (err: any) {
      toast(err.message || "Top-up failed", "error");
    } finally {
      setTopUpLoading(false);
    }
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      topup: "Top-up",
      service_purchase: "Service Purchase",
      rental_purchase: "Rental Purchase",
      admin_adjustment: "Admin Adjustment",
      refund: "Refund",
    };
    return labels[source] || source;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          title="My Wallet"
          description="Manage your balance and view transaction history"
        />

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl p-6 mb-8 shadow-lg">
          <p className="text-emerald-100 text-sm mb-1">Available Balance</p>
          <p className="text-4xl font-bold">${balance.toFixed(2)}</p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowTopUp(true)}
              className="bg-white text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 transition"
            >
              + Add Balance
            </button>
          </div>
        </div>

        {/* Top-Up Modal */}
        {showTopUp && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">Add Balance</h2>
              <p className="text-slate-400 text-sm mb-4">
                Enter the amount you want to add to your wallet.
              </p>

              <div className="mb-4">
                <label className="block text-sm text-slate-300 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white"
                />
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mb-6">
                {[10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTopUpAmount(String(amt))}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg py-2 text-sm"
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTopUp(false);
                    setTopUpAmount("");
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 rounded-lg py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTopUp}
                  disabled={topUpLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg py-3 font-medium disabled:opacity-50"
                >
                  {topUpLoading ? "Processing..." : "Add Balance"}
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-4 text-center">
                Balance is typically credited within a few minutes after
                confirmation.
              </p>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-slate-900 rounded-xl border border-slate-800">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold">Transaction History</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon="💳"
                title="No transactions yet"
                description="Add funds to your wallet to start using services instantly."
                ctaText="Add Balance"
                ctaHref="#"
                secondaryCtaText="Explore Services"
                secondaryCtaHref="/explore-services"
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {transactions.map((tx) => (
                <div
                  key={tx._id}
                  className="p-4 flex items-center justify-between hover:bg-slate-800/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === "credit"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "-"}
                    </div>
                    <div>
                      <p className="font-medium">{getSourceLabel(tx.source)}</p>
                      <p className="text-sm text-slate-400">
                        {tx.description || getSourceLabel(tx.source)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        tx.type === "credit"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "-"}${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Balance: ${tx.balanceAfter.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-slate-900/50 rounded-lg p-4 border border-slate-800">
          <h3 className="font-medium mb-2">💡 How to use your wallet</h3>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Add balance using the button above</li>
            <li>• Use wallet balance to pay for services and rentals</li>
            <li>• At checkout, select &quot;Pay with Wallet&quot; option</li>
            <li>• Refunds are automatically credited to your wallet</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
