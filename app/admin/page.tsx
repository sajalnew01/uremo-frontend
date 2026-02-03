"use client";

/**
 * PATCH_56: Admin Control Center Redesign (Zero-Confusion Mode)
 *
 * Structure:
 * 1. ⚠️ URGENT ACTIONS - Items needing immediate attention
 * 2. 📊 TODAY'S SNAPSHOT - Quick stats
 * 3. 🔄 RECENT ACTIVITY FEED - Latest events
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

interface UrgentStats {
  pendingOrders: number;
  pendingProofs: number;
  openTickets: number;
  pendingApplications: number;
}

interface TodayStats {
  ordersToday: number;
  revenueToday: number;
  newUsers: number;
  activeWorkers: number;
}

interface ActivityItem {
  id: string;
  type: "order" | "proof" | "ticket" | "worker" | "application";
  message: string;
  time: string;
  icon: string;
}

// Severity colors for urgent items
const SEVERITY = {
  critical: {
    bg: "from-red-500/20 to-red-500/5",
    border: "border-red-500/40 hover:border-red-500/60",
    badge: "bg-red-500 text-white",
    text: "text-red-400",
    glow: "shadow-red-500/20",
  },
  high: {
    bg: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/40 hover:border-amber-500/60",
    badge: "bg-amber-500 text-white",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
  },
  medium: {
    bg: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/40 hover:border-blue-500/60",
    badge: "bg-blue-500 text-white",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
  },
  low: {
    bg: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/40 hover:border-emerald-500/60",
    badge: "bg-emerald-500 text-white",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/20",
  },
};

export default function AdminControlCenter() {
  const [urgentStats, setUrgentStats] = useState<UrgentStats>({
    pendingOrders: 0,
    pendingProofs: 0,
    openTickets: 0,
    pendingApplications: 0,
  });
  const [todayStats, setTodayStats] = useState<TodayStats>({
    ordersToday: 0,
    revenueToday: 0,
    newUsers: 0,
    activeWorkers: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Fetch orders
        const ordersRes = await apiRequest<any>(
          "/api/admin/orders",
          "GET",
          null,
          true,
        );
        const orders = Array.isArray(ordersRes)
          ? ordersRes
          : ordersRes?.orders || [];

        // Fetch tickets
        const ticketsRes = await apiRequest<any>(
          "/api/admin/tickets",
          "GET",
          null,
          true,
        );

        // Fetch proofs
        const proofsRes = await apiRequest<any>(
          "/api/admin/proofs",
          "GET",
          null,
          true,
        );

        // Fetch applications
        const appsRes = await apiRequest<any>(
          "/api/admin/applications",
          "GET",
          null,
          true,
        );

        // Fetch workers
        const workersRes = await apiRequest<any>(
          "/api/admin/workspace/workers",
          "GET",
          null,
          true,
        );

        // Fetch users for today's stats
        const usersRes = await apiRequest<any>(
          "/api/admin/users?limit=100",
          "GET",
          null,
          true,
        );

        // Calculate urgent stats
        const pendingOrders = orders.filter(
          (o: any) => o.status === "pending" || o.status === "payment_pending",
        ).length;

        const pendingProofs =
          proofsRes?.proofs?.filter((p: any) => p.status === "pending")
            .length || 0;

        const openTickets = ticketsRes?.stats?.open || 0;

        const applications = Array.isArray(appsRes)
          ? appsRes
          : appsRes?.applications || [];
        const pendingApplications = applications.filter(
          (a: any) => a.status === "pending",
        ).length;

        setUrgentStats({
          pendingOrders,
          pendingProofs,
          openTickets,
          pendingApplications,
        });

        // Calculate today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ordersToday = orders.filter((o: any) => {
          const created = new Date(o.createdAt);
          return created >= today;
        }).length;

        const revenueToday = orders
          .filter((o: any) => {
            const created = new Date(o.createdAt);
            return created >= today && o.status !== "cancelled";
          })
          .reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

        const users = Array.isArray(usersRes)
          ? usersRes
          : usersRes?.users || [];
        const newUsers = users.filter((u: any) => {
          const created = new Date(u.createdAt);
          return created >= today;
        }).length;

        const workers = Array.isArray(workersRes)
          ? workersRes
          : workersRes?.workers || [];
        const activeWorkers = workers.filter((w: any) => w.isActive).length;

        setTodayStats({
          ordersToday,
          revenueToday,
          newUsers,
          activeWorkers,
        });

        // Build activity feed
        const activityItems: ActivityItem[] = [];

        // Recent orders
        orders.slice(0, 5).forEach((o: any) => {
          activityItems.push({
            id: `order-${o._id}`,
            type: "order",
            message: `Order ${o.status === "completed" ? "completed" : o.status === "pending" ? "pending" : "updated"}: ${o.serviceId?.title?.slice(0, 30) || "Service"}`,
            time: o.updatedAt || o.createdAt,
            icon:
              o.status === "completed"
                ? "✅"
                : o.status === "pending"
                  ? "📦"
                  : "🔄",
          });
        });

        // Recent tickets
        const tickets = ticketsRes?.tickets || [];
        tickets.slice(0, 3).forEach((t: any) => {
          activityItems.push({
            id: `ticket-${t._id}`,
            type: "ticket",
            message: `Ticket: ${t.subject?.slice(0, 40) || "Support request"}`,
            time: t.updatedAt || t.createdAt,
            icon: t.status === "open" ? "🎫" : "💬",
          });
        });

        // Sort by time
        activityItems.sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
        );

        setActivities(activityItems.slice(0, 10));
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
    // Refresh every 30 seconds
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getSeverity = (count: number) => {
    if (count >= 10) return SEVERITY.critical;
    if (count >= 5) return SEVERITY.high;
    if (count >= 1) return SEVERITY.medium;
    return SEVERITY.low;
  };

  const totalUrgent =
    urgentStats.pendingOrders +
    urgentStats.pendingProofs +
    urgentStats.openTickets +
    urgentStats.pendingApplications;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:pl-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg shadow-lg">
            ⚡
          </span>
          Admin Control Center
        </h1>
        <p className="text-slate-400 mt-2">
          {loading
            ? "Loading dashboard..."
            : totalUrgent > 0
              ? `${totalUrgent} items need your attention`
              : "All clear — no urgent tasks"}
        </p>
      </div>

      {/* SECTION 1: ⚠️ URGENT ACTIONS */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          Urgent Actions
          {totalUrgent > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-sm font-semibold ml-2">
              {totalUrgent} pending
            </span>
          )}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Orders */}
          <UrgentCard
            href="/admin/orders?status=pending"
            icon="📦"
            label="Pending Orders"
            count={urgentStats.pendingOrders}
            loading={loading}
            severity={getSeverity(urgentStats.pendingOrders)}
          />

          {/* Pending Proofs */}
          <UrgentCard
            href="/admin/proofs"
            icon="✅"
            label="Pending Proofs"
            count={urgentStats.pendingProofs}
            loading={loading}
            severity={getSeverity(urgentStats.pendingProofs)}
          />

          {/* Open Tickets */}
          <UrgentCard
            href="/admin/tickets"
            icon="🎫"
            label="Open Tickets"
            count={urgentStats.openTickets}
            loading={loading}
            severity={getSeverity(urgentStats.openTickets)}
          />

          {/* Pending Applications */}
          <UrgentCard
            href="/admin/applications"
            icon="📄"
            label="Job Applications"
            count={urgentStats.pendingApplications}
            loading={loading}
            severity={getSeverity(urgentStats.pendingApplications)}
          />
        </div>
      </section>

      {/* SECTION 2: 📊 TODAY'S SNAPSHOT */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span>
          Today's Snapshot
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="📦"
            label="Orders Today"
            value={loading ? "..." : String(todayStats.ordersToday)}
            color="blue"
          />
          <StatCard
            icon="💰"
            label="Revenue Today"
            value={loading ? "..." : `$${todayStats.revenueToday.toFixed(0)}`}
            color="emerald"
          />
          <StatCard
            icon="👤"
            label="New Users"
            value={loading ? "..." : String(todayStats.newUsers)}
            color="purple"
          />
          <StatCard
            icon="👷"
            label="Active Workers"
            value={loading ? "..." : String(todayStats.activeWorkers)}
            color="amber"
          />
        </div>
      </section>

      {/* SECTION 3: 🔄 RECENT ACTIVITY FEED */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🔄</span>
          Recent Activity
        </h2>

        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              Loading activity...
            </div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <span className="text-3xl block mb-2">📭</span>
              No recent activity
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition"
                >
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {activity.message}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {formatTimeAgo(activity.time)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🚀</span>
          Quick Access
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <QuickLink href="/admin/orders" icon="📦" label="Orders" />
          <QuickLink href="/admin/services" icon="🛠️" label="Services" />
          <QuickLink
            href="/admin/workspace/workers"
            icon="👷"
            label="Workers"
          />
          <QuickLink href="/admin/wallet" icon="💰" label="Wallets" />
          <QuickLink href="/admin/analytics" icon="📈" label="Analytics" />
          <QuickLink href="/admin/settings" icon="⚙️" label="Settings" />
        </div>
      </section>
    </div>
  );
}

// Urgent Action Card Component
function UrgentCard({
  href,
  icon,
  label,
  count,
  loading,
  severity,
}: {
  href: string;
  icon: string;
  label: string;
  count: number;
  loading: boolean;
  severity: typeof SEVERITY.critical;
}) {
  const isEmpty = count === 0;

  return (
    <Link
      href={href}
      className={`
        relative p-5 rounded-2xl border transition-all group
        bg-gradient-to-br ${isEmpty ? "from-slate-800/50 to-slate-900/50 border-white/10" : severity.bg + " " + severity.border}
        hover:scale-[1.02] hover:shadow-lg ${isEmpty ? "" : severity.glow}
      `}
    >
      {/* Count Badge */}
      {!loading && count > 0 && (
        <div
          className={`absolute -top-2 -right-2 px-2.5 py-1 rounded-full text-xs font-bold ${severity.badge} shadow-lg`}
        >
          {count > 99 ? "99+" : count}
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl group-hover:scale-110 transition-transform">
          {icon}
        </span>
      </div>

      <p className="text-xl font-bold text-white mb-1">
        {loading ? "..." : count}
      </p>
      <p className="text-sm text-slate-400">{label}</p>

      <div
        className={`mt-3 text-xs font-medium ${isEmpty ? "text-slate-500" : severity.text}`}
      >
        {isEmpty ? "All clear ✓" : "Review →"}
      </div>
    </Link>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: "blue" | "emerald" | "purple" | "amber";
}) {
  const colors = {
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  };

  return (
    <div
      className={`p-4 rounded-xl border bg-gradient-to-br ${colors[color]} transition hover:border-white/20`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-slate-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

// Quick Link Component
function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition group"
    >
      <span className="text-2xl group-hover:scale-110 transition-transform">
        {icon}
      </span>
      <span className="text-xs text-slate-400 group-hover:text-white transition">
        {label}
      </span>
    </Link>
  );
}
