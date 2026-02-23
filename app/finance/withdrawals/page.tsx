"use client";

/**
 * WITHDRAWAL SYSTEM - Complete user withdrawal flow UI
 * Phase 1-8 Implementation (Safe Mode - Frontend Only)
 *
 * DO NOT MODIFY:
 * - Backend API endpoints
 * - Wallet balance calculation
 * - Ledger logic
 * - Status enums
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

// ==================== INTERFACE DEFINITIONS ====================

interface BalanceData {
  availableBalance: number;
  withdrawableBalance: number;
  pendingAmount: number;
}

interface WithdrawalRecord {
  id: string;
  amount: number;
  method: string;
  status: string;
  note?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

// ==================== SVG ICONS ====================

const IconArrowUp = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
    />
  </svg>
);

const IconWallet = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
    />
  </svg>
);

const IconClock = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 1.5m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const IconCheckCircle = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const IconAlert = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

const IconX = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const IconLock = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 1C5.9 1 1 5.9 1 12s4.9 11 11 11 11-4.9 11-11S18.1 1 12 1zm0-1c6.6 0 12 5.4 12 12s-5.4 12-12 12S0 18.6 0 12 5.4 0 12 0zm3.5 7H8.5c-.8 0-1.5.7-1.5 1.5v5c0 .8.7 1.5 1.5 1.5h7c.8 0 1.5-.7 1.5-1.5v-5c0-.8-.7-1.5-1.5-1.5zm-1 5.5v1.5H9.5v-1.5h5z" />
  </svg>
);

// ==================== STATUS COLOR MAPPER ====================

const getStatusDisplay = (status: string | undefined) => {
  const statusStr = status?.toLowerCase() || "";

  const statusConfig: Record<
    string,
    { color: string; bgColor: string; label: string }
  > = {
    pending: {
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      label: "Pending Review",
    },
    approved: {
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      label: "Approved",
    },
    completed: {
      color: "text-green-600",
      bgColor: "bg-green-50",
      label: "Completed",
    },
    rejected: {
      color: "text-red-600",
      bgColor: "bg-red-50",
      label: "Rejected",
    },
  };

  return (
    statusConfig[statusStr] || {
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      label: statusStr.charAt(0).toUpperCase() + statusStr.slice(1),
    }
  );
};

// ==================== COMPONENT ====================

export default function WithdrawalPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // ===== STATE MANAGEMENT =====
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [note, setNote] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ===== PHASE 6: Detect pending withdrawals =====
  const hasPendingWithdrawal = useMemo(() => {
    return withdrawals.some((w) => w.status?.toLowerCase() === "pending");
  }, [withdrawals]);

  // ===== PHASE 3: Fetch balance summary =====
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const data = await apiRequest("/api/wallet/balance", "GET");
        setBalance(data);
      } catch (error: any) {
        toast(error?.message || "Failed to fetch balance", "error");
      } finally {
        setLoadingBalance(false);
      }
    };

    if (isAuthenticated) {
      fetchBalance();
    }
  }, [isAuthenticated, toast]);

  // Fetch payment methods for form dropdown
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const data = await apiRequest("/api/payment-methods", "GET");
        const activeMethods = Array.isArray(data)
          ? data.filter((m) => m.isActive)
          : [];
        setPaymentMethods(activeMethods);
      } catch (error: any) {
        // If endpoint doesn't exist, use fallback methods
        setPaymentMethods([
          { id: "bank", name: "Bank Transfer", type: "bank", isActive: true },
          { id: "paypal", name: "PayPal", type: "paypal", isActive: true },
        ]);
      }
    };

    if (isAuthenticated) {
      fetchPaymentMethods();
    }
  }, [isAuthenticated]);

  // Fetch withdrawal history
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await apiRequest("/api/wallet/withdrawals", "GET");
      setWithdrawals(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast(error?.message || "Failed to fetch withdrawal history", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated]);

  // ===== PHASE 4: Form validation =====
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const amountNum = parseFloat(amount);
    if (!amount || amount.trim() === "") {
      errors.amount = "Amount is required";
    } else if (isNaN(amountNum)) {
      errors.amount = "Amount must be a valid number";
    } else if (amountNum < 10) {
      errors.amount = "Minimum withdrawal is $10";
    } else if (balance && amountNum > balance.withdrawableBalance) {
      errors.amount = `Cannot exceed withdrawable balance ($${balance.withdrawableBalance.toFixed(2)})`;
    }

    if (!method || method.trim() === "") {
      errors.method = "Please select a payment method";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ===== PHASE 4: Handle form submission =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const trimmedNote = note.trim();
      const payload = {
        amount: parseFloat(amount),
        method,
        ...(trimmedNote && { note: trimmedNote }),
      };

      const result = await apiRequest("/api/wallet/withdraw", "POST", payload);

      // Success flow
      toast("Withdrawal request submitted. Awaiting admin review.", "success");

      // Clear form
      setAmount("");
      setMethod("");
      setNote("");
      setFormErrors({});

      // Refetch history and balance
      await fetchHistory();
      const updatedBalance = await apiRequest("/api/wallet/balance", "GET");
      setBalance(updatedBalance);
    } catch (error: any) {
      toast(error?.message || "Failed to submit withdrawal request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== RENDER =====
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <button
          onClick={() =>
            router.push(
              `/login?next=${encodeURIComponent("/finance/withdrawals")}`,
            )
          }
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Login to access withdrawals
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconArrowUp />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              Withdraw Funds
            </h1>
          </div>
          <p className="text-slate-600 ml-11">
            Securely withdraw your earnings
          </p>
        </motion.div>

        {/* ===== PHASE 3: BALANCE SUMMARY SECTION ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Available Balance Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-600">
                Available Balance
              </span>
              <div className="p-2 bg-blue-50 rounded-lg">
                <IconWallet />
              </div>
            </div>
            {loadingBalance ? (
              <div className="h-8 bg-slate-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-slate-900">
                ${(balance?.availableBalance ?? 0).toFixed(2)}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-3">
              Total earnings in your account
            </p>
          </div>

          {/* Withdrawable Balance Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-600">
                Withdrawable Balance
              </span>
              <div className="p-2 bg-green-50 rounded-lg">
                <IconCheckCircle />
              </div>
            </div>
            {loadingBalance ? (
              <div className="h-8 bg-slate-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-slate-900">
                ${(balance?.withdrawableBalance ?? 0).toFixed(2)}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-3">
              Available to withdraw immediately
            </p>
          </div>

          {/* Pending Amount Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-600">
                Pending Withdrawal
              </span>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <IconClock />
              </div>
            </div>
            {loadingBalance ? (
              <div className="h-8 bg-slate-200 rounded animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-slate-900">
                ${(balance?.pendingAmount ?? 0).toFixed(2)}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-3">
              Awaiting admin approval
            </p>
          </div>
        </motion.div>

        {/* ===== PHASE 6: LOCK LOGIC WARNING ===== */}
        <AnimatePresence>
          {hasPendingWithdrawal && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3"
            >
              <IconAlert />
              <div>
                <p className="font-medium text-yellow-900">
                  Pending Withdrawal Active
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  You have a pending withdrawal request. You can submit another,
                  but only one can be processed at a time.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== PHASE 4: WITHDRAWAL REQUEST FORM ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Request Withdrawal
          </h2>

          {/* Minimum requirement check */}
          {balance && balance.withdrawableBalance < 10 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <IconAlert />
              <div>
                <p className="font-medium text-red-900">
                  Minimum balance not met
                </p>
                <p className="text-sm text-red-700 mt-1">
                  You need at least $10 to withdraw. Current withdrawable
                  balance: ${(balance.withdrawableBalance ?? 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Field */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Withdrawal Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  $
                </span>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (formErrors.amount) {
                      setFormErrors({ ...formErrors, amount: "" });
                    }
                  }}
                  disabled={
                    submitting ||
                    loadingBalance ||
                    !balance ||
                    balance.withdrawableBalance < 10
                  }
                  className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              {balance && (
                <p className="text-xs text-slate-500 mt-2">
                  Maximum available: $
                  {(balance.withdrawableBalance ?? 0).toFixed(2)}
                </p>
              )}
              {formErrors.amount && (
                <p className="text-sm text-red-600 mt-2">{formErrors.amount}</p>
              )}
            </div>

            {/* Method Field */}
            <div>
              <label
                htmlFor="method"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                id="method"
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value);
                  if (formErrors.method) {
                    setFormErrors({ ...formErrors, method: "" });
                  }
                }}
                disabled={submitting || paymentMethods.length === 0}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">Select a payment method</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
              {formErrors.method && (
                <p className="text-sm text-red-600 mt-2">{formErrors.method}</p>
              )}
            </div>

            {/* Notes Field */}
            <div>
              <label
                htmlFor="note"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Notes (Optional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
                placeholder="Add any special instructions or notes..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed resize-none"
                rows={3}
              />
              <p className="text-xs text-slate-500 mt-2">
                For admin review only
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={
                submitting ||
                loadingBalance ||
                !balance ||
                balance.withdrawableBalance < 10
              }
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                `Submit Withdrawal Request${amount ? ` - $${parseFloat(amount).toFixed(2)}` : ""}`
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* ===== PHASE 5: WITHDRAWAL HISTORY TABLE ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm"
        >
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Withdrawal History
            </h2>
          </div>

          {loadingHistory ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-200 rounded animate-pulse"
                />
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-block p-3 bg-slate-100 rounded-lg mb-4">
                <IconWallet />
              </div>
              <p className="text-slate-600 font-medium">
                No withdrawal history yet
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Submit your first withdrawal request above
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal, idx) => {
                    const statusDisplay = getStatusDisplay(withdrawal.status);
                    return (
                      <motion.tr
                        key={withdrawal.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {new Date(withdrawal.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          ${(withdrawal.amount ?? 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {withdrawal.method}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.color} ${statusDisplay.bgColor}`}
                          >
                            {statusDisplay.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {withdrawal.status?.toLowerCase() === "rejected" &&
                          withdrawal.adminNote ? (
                            <div className="max-w-xs">
                              <p className="font-semibold text-red-700 mb-1">
                                Rejection Reason:
                              </p>
                              <p className="text-red-600">
                                {withdrawal.adminNote}
                              </p>
                            </div>
                          ) : withdrawal.note ? (
                            <p className="text-slate-600 max-w-xs truncate">
                              {withdrawal.note}
                            </p>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* ===== PHASE 7: INFORMATION PANEL ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <IconAlert />
            Important Information
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Minimum withdrawal amount is $10</li>
            <li>✓ Withdrawals are processed within 3-5 business days</li>
            <li>
              ✓ You can submit multiple requests, but only one pending at a time
            </li>
            <li>✓ All withdrawals are reviewed by our admin team</li>
            <li>
              ✓ Rejected withdrawals will include a reason in your history
            </li>
            <li>✓ Bank transfer fees may apply (verify with your bank)</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
