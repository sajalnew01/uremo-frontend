"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

// PATCH_54: Admin Control Center Dashboard with KPI cards
interface DashboardStats {
  pendingOrders: number;
  paymentPending: number;
  openTickets: number;
  pendingProofs: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingOrders: 0,
    paymentPending: 0,
    openTickets: 0,
    pendingProofs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Fetch orders
        const orders = await apiRequest<any[]>(
          "/api/admin/orders",
          "GET",
          null,
          true,
        );

        // Fetch tickets
        const tickets = await apiRequest<any>(
          "/api/admin/tickets",
          "GET",
          null,
          true,
        );

        // Fetch proofs
        const proofs = await apiRequest<any>(
          "/api/admin/proofs",
          "GET",
          null,
          true,
        );

        // Count pending items
        const pendingCount =
          orders?.filter(
            (o) => o.status === "pending" || o.status === "payment_pending",
          ).length || 0;
        const paymentPendingCount =
          orders?.filter((o) => o.status === "payment_pending").length || 0;
        const pendingProofsCount =
          proofs?.proofs?.filter((p: any) => p.status === "pending").length ||
          0;

        setStats({
          pendingOrders: pendingCount,
          paymentPending: paymentPendingCount,
          openTickets: tickets?.stats?.open || 0,
          pendingProofs: pendingProofsCount,
        });
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:pl-8">
      {/* PATCH_54: Admin Control Center Dashboard */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          Admin Control Center
        </h1>
        <p className="text-sm text-slate-400">
          Quick overview of pending actions across all departments
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          href="/admin/orders?status=pending"
          className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl group-hover:scale-110 transition-transform">
              📦
            </span>
            {!loading && stats.pendingOrders > 0 && (
              <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
                {stats.pendingOrders}
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-white">
            {loading ? "..." : stats.pendingOrders}
          </p>
          <p className="text-sm text-slate-400">Pending Orders</p>
        </Link>

        <Link
          href="/admin/orders?status=payment_pending"
          className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl group-hover:scale-110 transition-transform">
              💰
            </span>
            {!loading && stats.paymentPending > 0 && (
              <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                {stats.paymentPending}
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-white">
            {loading ? "..." : stats.paymentPending}
          </p>
          <p className="text-sm text-slate-400">Payment Pending</p>
        </Link>

        <Link
          href="/admin/tickets"
          className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 hover:border-red-500/40 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl group-hover:scale-110 transition-transform">
              🎫
            </span>
            {!loading && stats.openTickets > 0 && (
              <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold">
                {stats.openTickets}
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-white">
            {loading ? "..." : stats.openTickets}
          </p>
          <p className="text-sm text-slate-400">Open Tickets</p>
        </Link>

        <Link
          href="/admin/proofs"
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl group-hover:scale-110 transition-transform">
              ✅
            </span>
            {!loading && stats.pendingProofs > 0 && (
              <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                {stats.pendingProofs}
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-white">
            {loading ? "..." : stats.pendingProofs}
          </p>
          <p className="text-sm text-slate-400">Pending Proofs</p>
        </Link>
      </div>

      {/* PATCH_54: Quick Navigation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Operations */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Operations
          </h3>
          <div className="space-y-2">
            <Link
              href="/admin/orders"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white"
            >
              <span>📦 Orders</span>
              <span className="text-xs text-slate-500">→</span>
            </Link>
            <Link
              href="/admin/proofs"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white"
            >
              <span>✅ Proofs</span>
              <span className="text-xs text-slate-500">→</span>
            </Link>
            <Link
              href="/admin/tickets"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white"
            >
              <span>🎫 Tickets</span>
              <span className="text-xs text-slate-500">→</span>
            </Link>
          </div>
        </div>

        {/* Finance */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Finance
          </h3>
          <div className="space-y-2">
            <Link
              href="/admin/wallet"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white"
            >
              <span>💳 Wallets</span>
              <span className="text-xs text-slate-500">→</span>
            </Link>
            <Link
              href="/admin/payments"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white"
            >
              <span>💰 Payments</span>
              <span className="text-xs text-slate-500">→</span>
            </Link>
            <Link
              href="/admin/affiliates"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white"
            >
              <span>👥 Affiliates</span>
              <span className="text-xs text-slate-500">→</span>
            </Link>
          </div>
        </div>

        {/* System */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            System
          </h3>
          <div className="space-y-2">
            <Link
              href="/admin/analytics"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white"
            >
              <span>📊 Analytics</span>
              <span className="text-xs text-slate-500">→</span>
            </Link>
            <Link
              href="/admin/campaigns"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white"
            >
              <span>📢 Campaigns</span>
              <span className="text-xs text-slate-500">→</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white"
            >
              <span>⚙️ Settings</span>
              <span className="text-xs text-slate-500">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
