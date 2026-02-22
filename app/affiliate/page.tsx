"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { EmojiAffiliate } from "@/components/ui/Emoji";
import { getStatusColor, getStatusLabel } from "@/lib/statusConfig";

interface CommissionSummary {
  totalEarnings: number;
  availableBalance: number;
  withdrawnAmount: number;
  pendingWithdrawal: number;
}

interface Commission {
  _id: string;
  referredUserEmail: string;
  referredUserName: string;
  orderId: string | null;
  orderAmount: number;
  commissionAmount: number;
  commissionRate: number;
  status: string;
  date: string;
}

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
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "commissions" | "withdrawals"
  >("overview");

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
      const [statsData, commissionsData, wdData] = await Promise.all([
        apiRequest("/api/affiliate/stats", "GET", null, true),
        apiRequest("/api/affiliate/commissions", "GET", null, true),
        apiRequest("/api/affiliate/withdrawals", "GET", null, true),
      ]);
      setStats(statsData?.stats || null);
      setCommissions(commissionsData?.commissions || []);
      setSummary(commissionsData?.summary || null);
      setWithdrawals(wdData?.withdrawals || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load affiliate data";
      toast(message, "error");
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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit withdrawal";
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // PATCH_52: Use centralized status from statusConfig
  const getStatusBadgeClass = (status: string) => {
    return `px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const successfulReferrals = commissions.filter(
    (c) => c.status === "approved",
  ).length;

  if (loading) {
    return (
      <div className="u-container max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Affiliate Dashboard</h1>
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
      className="u-container max-w-6xl"
    >
      <PageHeader
        title="Affiliate Dashboard"
        emoji={<EmojiAffiliate />}
        description={`Earn ${stats?.commissionRate || 10}% commission on every referral purchase`}
      />

      {/* Stats Cards - 4 Cards as required */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card text-center border border-emerald-500/30">
          <p className="text-xs text-slate-400 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-emerald-300">
            $
            {(
              summary?.totalEarnings ||
              stats?.totalAffiliateEarned ||
              0
            ).toFixed(2)}
          </p>
        </div>
        <div className="card text-center border border-blue-500/30">
          <p className="text-xs text-slate-400 mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-blue-300">
            $
            {(
              summary?.availableBalance ||
              stats?.affiliateBalance ||
              0
            ).toFixed(2)}
          </p>
        </div>
        <div className="card text-center border border-purple-500/30">
          <p className="text-xs text-slate-400 mb-1">Withdrawn Amount</p>
          <p className="text-3xl font-bold text-purple-300">
            ${(summary?.withdrawnAmount || 0).toFixed(2)}
          </p>
        </div>
        <div className="card text-center border border-orange-500/30">
          <p className="text-xs text-slate-400 mb-1">Successful Referrals</p>
          <p className="text-3xl font-bold text-orange-300">
            {successfulReferrals}
          </p>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="card mb-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Your Referral Code</p>
            <p className="text-2xl font-mono font-bold text-white">
              {stats?.referralCode || "—"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Share this code or link to earn commissions
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={copyReferralLink}
              className="btn-secondary text-sm"
            >
              Copy Referral Link
            </button>
            {(summary?.availableBalance || stats?.affiliateBalance || 0) >=
              (stats?.minimumWithdrawal || 10) && (
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="btn-primary text-sm"
              >
                Request Withdrawal
              </button>
            )}
          </div>
        </div>
        {(summary?.pendingWithdrawal || stats?.pendingWithdrawals || 0) > 0 && (
          <p className="text-xs text-yellow-400 mt-3">
            ⏳ Pending withdrawal: $
            {(
              summary?.pendingWithdrawal ||
              stats?.pendingWithdrawals ||
              0
            ).toFixed(2)}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-white/10 pb-2">
        {(["overview", "commissions", "withdrawals"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm px-4 py-2 rounded-t transition ${
              activeTab === tab
                ? "bg-white/10 text-white border-b-2 border-purple-500"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab === "overview"
              ? "Overview"
              : tab === "commissions"
                ? "Referral History"
                : "Withdrawals"}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="card">
          <h3 className="font-semibold mb-4 text-lg">How It Works</h3>
          <div className="space-y-4 text-sm text-slate-300">
            <div className="flex gap-4 items-start p-3 rounded-lg bg-white/5">
              <span className="text-2xl">1️⃣</span>
              <div>
                <p className="font-medium text-white">Share Your Link</p>
                <p className="text-slate-400">
                  Share your unique referral link with friends, on social media,
                  or forums
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-3 rounded-lg bg-white/5">
              <span className="text-2xl">2️⃣</span>
              <div>
                <p className="font-medium text-white">
                  They Sign Up & Purchase
                </p>
                <p className="text-slate-400">
                  When someone signs up using your link and makes a purchase,
                  you earn {stats?.commissionRate || 10}% commission
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-3 rounded-lg bg-white/5">
              <span className="text-2xl">3️⃣</span>
              <div>
                <p className="font-medium text-white">Withdraw Your Earnings</p>
                <p className="text-slate-400">
                  Once you reach ${stats?.minimumWithdrawal || 10}, withdraw via
                  PayPal, Crypto, or Bank Transfer
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <p className="text-sm text-purple-200">
              <strong>Pro Tip:</strong> The more you share, the more you earn!
              Your commission is credited automatically when your referrals make
              purchases.
            </p>
          </div>
        </div>
      )}

      {/* Commissions/Referral History Tab */}
      {activeTab === "commissions" && (
        <div>
          {commissions.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="$"
                title="No commissions yet"
                description="Share your unique referral link with friends and earn 10% commission on every purchase they make. It's that simple!"
                ctaText="Copy Referral Link"
                ctaHref="#"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-3 px-4 text-slate-400 font-medium">
                      Referred User
                    </th>
                    <th className="py-3 px-4 text-slate-400 font-medium">
                      Order ID
                    </th>
                    <th className="py-3 px-4 text-slate-400 font-medium text-right">
                      Order Amount
                    </th>
                    <th className="py-3 px-4 text-slate-400 font-medium text-right">
                      Commission
                    </th>
                    <th className="py-3 px-4 text-slate-400 font-medium text-center">
                      Status
                    </th>
                    <th className="py-3 px-4 text-slate-400 font-medium">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr
                      key={c._id}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="py-3 px-4">
                        <p className="text-white">{c.referredUserName}</p>
                        <p className="text-xs text-slate-500">
                          {c.referredUserEmail}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {c.orderId
                          ? `${String(c.orderId).slice(0, 8)}...`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        ${c.orderAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-300">
                        +${c.commissionAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(c.status)}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {formatDate(c.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === "withdrawals" && (
        <div className="space-y-3">
          {withdrawals.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-white text-lg">No withdrawal history</p>
              <p className="text-slate-400 text-sm mt-2">
                Request a withdrawal once you reach the minimum balance
              </p>
            </div>
          ) : (
            withdrawals.map((wd) => (
              <div key={wd._id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white text-lg">
                      ${wd.amount?.toFixed(2)}{" "}
                      <span className="text-sm text-slate-400">
                        via {wd.paymentMethod}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {wd.paymentDetails}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Requested: {formatDate(wd.createdAt)}
                    </p>
                    {wd.adminNotes && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        Note: {wd.adminNotes}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${getStatusColor(wd.status)}`}
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
                  placeholder={`Max: $${(summary?.availableBalance || stats?.affiliateBalance || 0).toFixed(2)}`}
                  className="u-input"
                  min={stats?.minimumWithdrawal || 10}
                  max={
                    summary?.availableBalance || stats?.affiliateBalance || 0
                  }
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
