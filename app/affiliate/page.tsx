"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface AffiliateStats {
  referralCode: string;
  affiliateBalance: number;
  totalAffiliateEarned: number;
  referredUsersCount: number;
  commissionRate: number;
  minimumWithdrawal: number;
  pendingWithdrawals: number;
  transactionsByStatus: Record<string, { count: number; total: number }>;
}

interface Transaction {
  _id: string;
  referredUser: { name: string; email: string };
  order: { status: string; amount: number };
  orderAmount: number;
  commission: number;
  status: string;
  createdAt: string;
}

interface Withdrawal {
  _id: string;
  amount: number;
  paymentMethod: string;
  paymentDetails: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

export default function AffiliatePage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "stats" | "transactions" | "withdrawals"
  >("stats");

  // Withdrawal form
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, txData, wdData] = await Promise.all([
        apiRequest("/api/affiliate/stats", "GET", null, true),
        apiRequest("/api/affiliate/transactions", "GET", null, true),
        apiRequest("/api/affiliate/withdrawals", "GET", null, true),
      ]);
      setStats(statsData?.stats || null);
      setTransactions(txData?.transactions || []);
      setWithdrawals(wdData?.withdrawals || []);
    } catch (err: any) {
      toast(err?.message || "Failed to load affiliate data", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!stats?.referralCode) return;
    const link = `${window.location.origin}/signup?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(link);
    toast("Referral link copied!", "success");
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !paymentDetails) {
      toast("Please fill in all fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(
        "/api/affiliate/withdraw",
        "POST",
        {
          amount: parseFloat(withdrawAmount),
          paymentMethod,
          paymentDetails,
        },
        true,
      );
      toast("Withdrawal request submitted!", "success");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setPaymentDetails("");
      loadData();
    } catch (err: any) {
      toast(err?.message || "Failed to submit withdrawal", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "paid":
        return "text-emerald-300 bg-emerald-500/20";
      case "pending":
        return "text-yellow-300 bg-yellow-500/20";
      case "rejected":
      case "cancelled":
        return "text-red-300 bg-red-500/20";
      default:
        return "text-slate-300 bg-slate-500/20";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="u-container max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Affiliate Earnings</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 w-48 bg-white/10 rounded" />
              <div className="h-4 w-32 bg-white/10 rounded mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="u-container max-w-5xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Affiliate Earnings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Earn {stats?.commissionRate || 10}% commission on every referral
            purchase
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-xs text-slate-400">Available Balance</p>
          <p className="text-2xl font-bold text-emerald-300">
            ${stats?.affiliateBalance?.toFixed(2) || "0.00"}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400">Total Earned</p>
          <p className="text-2xl font-bold text-white">
            ${stats?.totalAffiliateEarned?.toFixed(2) || "0.00"}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400">Referred Users</p>
          <p className="text-2xl font-bold text-white">
            {stats?.referredUsersCount || 0}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400">Commission Rate</p>
          <p className="text-2xl font-bold text-purple-300">
            {stats?.commissionRate || 10}%
          </p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Your Referral Code</p>
            <p className="text-2xl font-mono font-bold text-white">
              {stats?.referralCode || "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyReferralLink}
              className="btn-secondary text-sm"
            >
              📋 Copy Link
            </button>
            {(stats?.affiliateBalance || 0) >=
              (stats?.minimumWithdrawal || 10) && (
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="btn-primary text-sm"
              >
                💸 Withdraw
              </button>
            )}
          </div>
        </div>
        {stats?.pendingWithdrawals ? (
          <p className="text-xs text-yellow-400 mt-2">
            Pending withdrawal: ${stats.pendingWithdrawals.toFixed(2)}
          </p>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-white/10 pb-2">
        {(["stats", "transactions", "withdrawals"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm px-3 py-1 rounded transition ${
              activeTab === tab
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === "stats" && (
        <div className="card">
          <h3 className="font-semibold mb-4">How It Works</h3>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex gap-3">
              <span className="text-lg">1️⃣</span>
              <p>Share your unique referral link with friends</p>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">2️⃣</span>
              <p>
                When they sign up and make a purchase, you earn{" "}
                {stats?.commissionRate || 10}% commission
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">3️⃣</span>
              <p>
                Withdraw your earnings once you reach $
                {stats?.minimumWithdrawal || 10}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <p className="text-sm text-purple-200">
              <strong>💡 Pro tip:</strong> Share your link on social media,
              forums, or with your network to maximize earnings!
            </p>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-slate-400">No commission transactions yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Start sharing your referral link to earn!
              </p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx._id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white">
                      Commission from{" "}
                      {tx.referredUser?.name ||
                        tx.referredUser?.email ||
                        "User"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Order: ${tx.orderAmount?.toFixed(2)} •{" "}
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-300">
                      +${tx.commission?.toFixed(2)}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(tx.status)}`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === "withdrawals" && (
        <div className="space-y-3">
          {withdrawals.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-slate-400">No withdrawal history</p>
            </div>
          ) : (
            withdrawals.map((wd) => (
              <div key={wd._id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white">
                      ${wd.amount?.toFixed(2)} via {wd.paymentMethod}
                    </p>
                    <p className="text-xs text-slate-400">
                      {wd.paymentDetails} • {formatDate(wd.createdAt)}
                    </p>
                    {wd.adminNotes && (
                      <p className="text-xs text-slate-500 mt-1">
                        {wd.adminNotes}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(wd.status)}`}
                  >
                    {wd.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWithdrawModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0B1220] p-6">
            <h3 className="text-lg font-semibold mb-4">Request Withdrawal</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1">
                  Amount (min ${stats?.minimumWithdrawal || 10})
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Max: $${stats?.affiliateBalance?.toFixed(2) || 0}`}
                  className="u-input"
                  min={stats?.minimumWithdrawal || 10}
                  max={stats?.affiliateBalance || 0}
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="u-select"
                >
                  <option value="paypal">PayPal</option>
                  <option value="crypto">Crypto (USDT/BTC)</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">
                  Payment Details (
                  {paymentMethod === "paypal"
                    ? "PayPal Email"
                    : paymentMethod === "crypto"
                      ? "Wallet Address"
                      : "Bank Details"}
                  )
                </label>
                <textarea
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder={
                    paymentMethod === "paypal"
                      ? "your@email.com"
                      : paymentMethod === "crypto"
                        ? "USDT TRC20: TXyz..."
                        : "Bank name, account number, IFSC..."
                  }
                  className="u-input min-h-[80px]"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-sm px-4 py-2 bg-white/10 rounded hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={submitting}
                  className="text-sm px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
