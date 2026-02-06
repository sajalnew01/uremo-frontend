"use client";

/**
 * PATCH_63: MASTER ADMIN REBUILD
 * ActionQueue - The DEFAULT admin landing view
 *
 * Aggregates ALL pending actions sorted by:
 * 1. Revenue impact
 * 2. Time blocked
 * 3. Risk level
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

interface ActionItem {
  id: string;
  type:
    | "payment"
    | "proof"
    | "order"
    | "screening"
    | "withdrawal"
    | "ticket"
    | "application";
  title: string;
  subtitle: string;
  priority: "critical" | "high" | "medium" | "low";
  revenueImpact: number;
  blockedHours: number;
  href: string;
  actionLabel: string;
  meta?: Record<string, any>;
}

interface SystemHealth {
  totalUsers: number;
  activeWorkers: number;
  ordersToday: number;
  revenueToday: number;
  avgResolutionTime: string;
}

export default function ActionQueuePage() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadActionQueue();
    // Refresh every 30 seconds
    const interval = setInterval(loadActionQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActionQueue = async () => {
    try {
      // Parallel fetch all data sources
      const [
        ordersRes,
        proofsRes,
        ticketsRes,
        appsRes,
        screeningsRes,
        affiliateRes,
        workersRes,
        usersRes,
      ] = await Promise.allSettled([
        apiRequest("/api/admin/orders", "GET", null, true),
        apiRequest("/api/admin/proofs", "GET", null, true),
        apiRequest("/api/admin/tickets", "GET", null, true),
        apiRequest("/api/apply-work/admin", "GET", null, true),
        apiRequest("/api/admin/workspace/screenings", "GET", null, true),
        apiRequest("/api/admin/affiliate/withdrawals", "GET", null, true),
        apiRequest("/api/admin/workspace/workers", "GET", null, true),
        apiRequest("/api/admin/users?limit=100", "GET", null, true),
      ]);

      const actionItems: ActionItem[] = [];
      const now = new Date();

      // Process Orders - Payment proofs are CRITICAL (revenue blockers)
      if (ordersRes.status === "fulfilled") {
        const orders = Array.isArray(ordersRes.value)
          ? ordersRes.value
          : ordersRes.value?.orders || [];

        orders.forEach((order: any) => {
          const createdAt = new Date(order.createdAt);
          const blockedHours = Math.floor(
            (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60),
          );

          if (order.status === "payment_pending") {
            actionItems.push({
              id: `order-payment-${order._id}`,
              type: "payment",
              title: `Payment Verification Required`,
              subtitle: `Order #${order._id.slice(-6)} - ${order.serviceId?.title?.slice(0, 30) || "Service"} - $${order.amount || 0}`,
              priority:
                blockedHours > 24
                  ? "critical"
                  : blockedHours > 6
                    ? "high"
                    : "medium",
              revenueImpact: order.amount || 0,
              blockedHours,
              href: `/admin/orders/${order._id}`,
              actionLabel: "Verify Payment",
              meta: order,
            });
          } else if (order.status === "pending") {
            actionItems.push({
              id: `order-pending-${order._id}`,
              type: "order",
              title: `Order Pending Action`,
              subtitle: `Order #${order._id.slice(-6)} - ${order.serviceId?.title?.slice(0, 30) || "Service"}`,
              priority: blockedHours > 48 ? "high" : "medium",
              revenueImpact: order.amount || 0,
              blockedHours,
              href: `/admin/orders/${order._id}`,
              actionLabel: "Review Order",
              meta: order,
            });
          }
        });

        // Calculate today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const ordersToday = orders.filter(
          (o: any) => new Date(o.createdAt) >= today,
        ).length;
        const revenueToday = orders
          .filter(
            (o: any) =>
              new Date(o.createdAt) >= today && o.status !== "cancelled",
          )
          .reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

        // Get user and worker counts
        let totalUsers = 0;
        let activeWorkers = 0;

        if (usersRes.status === "fulfilled") {
          const users = Array.isArray(usersRes.value)
            ? usersRes.value
            : usersRes.value?.users || [];
          totalUsers = users.length;
        }

        if (workersRes.status === "fulfilled") {
          const workers = Array.isArray(workersRes.value)
            ? workersRes.value
            : workersRes.value?.workers || [];
          activeWorkers = workers.filter((w: any) => w.isActive).length;
        }

        setHealth({
          totalUsers,
          activeWorkers,
          ordersToday,
          revenueToday,
          avgResolutionTime: calculateAvgResolution(orders),
        });
      }

      // Process Proofs - Blocks worker payouts
      if (proofsRes.status === "fulfilled") {
        const proofs = proofsRes.value?.proofs || [];

        proofs
          .filter((p: any) => p.status === "pending")
          .forEach((proof: any) => {
            const createdAt = new Date(proof.createdAt);
            const blockedHours = Math.floor(
              (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60),
            );

            actionItems.push({
              id: `proof-${proof._id}`,
              type: "proof",
              title: `Worker Proof Pending`,
              subtitle: `${proof.workerId?.userId?.email || "Worker"} - ${proof.projectId?.title?.slice(0, 30) || "Project"}`,
              priority:
                blockedHours > 72
                  ? "critical"
                  : blockedHours > 24
                    ? "high"
                    : "medium",
              revenueImpact: 0,
              blockedHours,
              href: `/admin/proofs`,
              actionLabel: "Review Proof",
              meta: proof,
            });
          });
      }

      // Process Tickets - Support backlog
      if (ticketsRes.status === "fulfilled") {
        const tickets = ticketsRes.value?.tickets || [];

        tickets
          .filter((t: any) => t.status === "open")
          .forEach((ticket: any) => {
            const createdAt = new Date(ticket.createdAt);
            const blockedHours = Math.floor(
              (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60),
            );

            actionItems.push({
              id: `ticket-${ticket._id}`,
              type: "ticket",
              title: `Support Ticket Open`,
              subtitle: ticket.subject?.slice(0, 50) || "Support request",
              priority:
                ticket.priority === "urgent"
                  ? "critical"
                  : blockedHours > 24
                    ? "high"
                    : "medium",
              revenueImpact: 0,
              blockedHours,
              href: `/admin/tickets`,
              actionLabel: "Respond",
              meta: ticket,
            });
          });
      }

      // Process Applications
      if (appsRes.status === "fulfilled") {
        const apps = Array.isArray(appsRes.value)
          ? appsRes.value
          : appsRes.value?.applications || [];

        apps
          .filter((a: any) => a.status === "pending")
          .forEach((app: any) => {
            const createdAt = new Date(app.createdAt);
            const blockedHours = Math.floor(
              (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60),
            );

            actionItems.push({
              id: `app-${app._id}`,
              type: "application",
              title: `Job Application Pending`,
              subtitle: `${app.userId?.email || "User"} - ${app.positionId?.title || "Position"}`,
              priority: blockedHours > 48 ? "high" : "medium",
              revenueImpact: 0,
              blockedHours,
              href: `/admin/workforce`,
              actionLabel: "Review",
              meta: app,
            });
          });
      }

      // Process Invalid Screenings
      if (screeningsRes.status === "fulfilled") {
        const screenings = Array.isArray(screeningsRes.value)
          ? screeningsRes.value
          : screeningsRes.value?.screenings || [];

        screenings
          .filter((s: any) => !s.questions || s.questions.length === 0)
          .forEach((screening: any) => {
            actionItems.push({
              id: `screening-${screening._id}`,
              type: "screening",
              title: `Invalid Screening (0 Questions)`,
              subtitle: `${screening.name || screening.title} - Category: ${screening.category || "Unknown"}`,
              priority: "critical",
              revenueImpact: 0,
              blockedHours: 999, // Always critical
              href: `/admin/workspace/screenings/${screening._id}`,
              actionLabel: "Fix Screening",
              meta: screening,
            });
          });
      }

      // Process Pending Withdrawals
      if (affiliateRes.status === "fulfilled") {
        const withdrawals = Array.isArray(affiliateRes.value)
          ? affiliateRes.value
          : affiliateRes.value?.withdrawals || [];

        withdrawals
          .filter((w: any) => w.status === "pending")
          .forEach((withdrawal: any) => {
            const createdAt = new Date(withdrawal.createdAt);
            const blockedHours = Math.floor(
              (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60),
            );

            actionItems.push({
              id: `withdrawal-${withdrawal._id}`,
              type: "withdrawal",
              title: `Affiliate Withdrawal Pending`,
              subtitle: `${withdrawal.userId?.email || "User"} - $${withdrawal.amount || 0}`,
              priority: blockedHours > 48 ? "high" : "medium",
              revenueImpact: -(withdrawal.amount || 0),
              blockedHours,
              href: `/admin/affiliates/withdrawals`,
              actionLabel: "Process",
              meta: withdrawal,
            });
          });
      }

      // Sort by priority, then revenue impact, then time blocked
      actionItems.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (Math.abs(a.revenueImpact) !== Math.abs(b.revenueImpact)) {
          return Math.abs(b.revenueImpact) - Math.abs(a.revenueImpact);
        }
        return b.blockedHours - a.blockedHours;
      });

      setActions(actionItems);
    } catch (err) {
      console.error("Failed to load action queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgResolution = (orders: any[]): string => {
    const completed = orders.filter(
      (o: any) => o.status === "completed" && o.completedAt,
    );
    if (completed.length === 0) return "N/A";

    const totalHours = completed.reduce((sum: number, o: any) => {
      const start = new Date(o.createdAt);
      const end = new Date(o.completedAt);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    const avgHours = totalHours / completed.length;
    if (avgHours < 24) return `${Math.round(avgHours)}h`;
    return `${Math.round(avgHours / 24)}d`;
  };

  const filteredActions =
    filter === "all" ? actions : actions.filter((a) => a.type === filter);

  const priorityCounts = {
    critical: actions.filter((a) => a.priority === "critical").length,
    high: actions.filter((a) => a.priority === "high").length,
    medium: actions.filter((a) => a.priority === "medium").length,
  };

  const typeCounts = {
    payment: actions.filter((a) => a.type === "payment").length,
    proof: actions.filter((a) => a.type === "proof").length,
    ticket: actions.filter((a) => a.type === "ticket").length,
    screening: actions.filter((a) => a.type === "screening").length,
    application: actions.filter((a) => a.type === "application").length,
    withdrawal: actions.filter((a) => a.type === "withdrawal").length,
    order: actions.filter((a) => a.type === "order").length,
  };

  return (
    <div className="min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-base shadow-lg">
            ⚡
          </span>
          Action Queue
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {loading
            ? "Checking..."
            : `${actions.length} items require your action`}
        </p>
      </div>

      {/* System Health Strip */}
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <HealthCard label="Users" value={health.totalUsers} icon="👥" />
          <HealthCard
            label="Active Workers"
            value={health.activeWorkers}
            icon="👷"
          />
          <HealthCard
            label="Orders Today"
            value={health.ordersToday}
            icon="📦"
          />
          <HealthCard
            label="Revenue Today"
            value={`$${health.revenueToday}`}
            icon="💰"
            color="emerald"
          />
          <HealthCard
            label="Avg Resolution"
            value={health.avgResolutionTime}
            icon="⏱️"
          />
        </div>
      )}

      {/* Priority Summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        <PriorityBadge
          label="Critical"
          count={priorityCounts.critical}
          color="red"
        />
        <PriorityBadge label="High" count={priorityCounts.high} color="amber" />
        <PriorityBadge
          label="Medium"
          count={priorityCounts.medium}
          color="blue"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <FilterTab
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
          count={actions.length}
        />
        <FilterTab
          active={filter === "payment"}
          onClick={() => setFilter("payment")}
          label="Payments"
          count={typeCounts.payment}
          color="red"
        />
        <FilterTab
          active={filter === "proof"}
          onClick={() => setFilter("proof")}
          label="Proofs"
          count={typeCounts.proof}
        />
        <FilterTab
          active={filter === "ticket"}
          onClick={() => setFilter("ticket")}
          label="Tickets"
          count={typeCounts.ticket}
        />
        <FilterTab
          active={filter === "screening"}
          onClick={() => setFilter("screening")}
          label="Screenings"
          count={typeCounts.screening}
          color="amber"
        />
        <FilterTab
          active={filter === "application"}
          onClick={() => setFilter("application")}
          label="Applications"
          count={typeCounts.application}
        />
        <FilterTab
          active={filter === "withdrawal"}
          onClick={() => setFilter("withdrawal")}
          label="Withdrawals"
          count={typeCounts.withdrawal}
        />
      </div>

      {/* Action Items Table */}
      <div className="bg-[#0a0d14] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading action queue...
          </div>
        ) : filteredActions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <div className="text-white font-medium">Queue Empty</div>
            <div className="text-slate-500 text-sm">
              No pending items in this view. Check back later or refresh.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredActions.map((action) => (
              <ActionRow key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HealthCard({
  label,
  value,
  icon,
  color = "blue",
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  };

  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${colorClasses[color] || colorClasses.blue} border p-3`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div>
          <div className="text-white font-semibold">{value}</div>
          <div className="text-slate-500 text-xs">{label}</div>
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  if (count === 0) return null;

  const colorClasses: Record<string, string> = {
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border ${colorClasses[color]}`}
    >
      {count} {label}
    </span>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                 ${
                   active
                     ? "bg-white/10 text-white"
                     : "text-slate-400 hover:bg-white/5 hover:text-white"
                 }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`px-1.5 py-0.5 rounded text-xs 
                        ${
                          color === "red"
                            ? "bg-red-500/20 text-red-400"
                            : color === "amber"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-white/10 text-slate-400"
                        }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ActionRow({ action }: { action: ActionItem }) {
  const priorityStyles: Record<
    string,
    { bg: string; border: string; dot: string }
  > = {
    critical: {
      bg: "bg-red-500/5 hover:bg-red-500/10",
      border: "border-l-red-500",
      dot: "bg-red-500",
    },
    high: {
      bg: "bg-amber-500/5 hover:bg-amber-500/10",
      border: "border-l-amber-500",
      dot: "bg-amber-500",
    },
    medium: {
      bg: "bg-blue-500/5 hover:bg-blue-500/10",
      border: "border-l-blue-500",
      dot: "bg-blue-500",
    },
    low: {
      bg: "bg-slate-500/5 hover:bg-slate-500/10",
      border: "border-l-slate-500",
      dot: "bg-slate-500",
    },
  };

  const typeIcons: Record<string, string> = {
    payment: "💳",
    proof: "📋",
    order: "📦",
    screening: "📝",
    withdrawal: "💸",
    ticket: "🎫",
    application: "👤",
  };

  const style = priorityStyles[action.priority];

  return (
    <Link
      href={action.href}
      className={`flex items-center gap-4 p-4 border-l-4 ${style.border} ${style.bg} transition-colors`}
    >
      {/* Priority Dot */}
      <div className={`w-2 h-2 rounded-full ${style.dot} flex-shrink-0`} />

      {/* Type Icon */}
      <div className="text-xl flex-shrink-0">{typeIcons[action.type]}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate">{action.title}</div>
        <div className="text-slate-500 text-sm truncate">{action.subtitle}</div>
      </div>

      {/* Meta */}
      <div className="hidden sm:flex items-center gap-4 text-sm text-slate-500 flex-shrink-0">
        {action.revenueImpact !== 0 && (
          <span
            className={
              action.revenueImpact > 0 ? "text-emerald-400" : "text-red-400"
            }
          >
            {action.revenueImpact > 0 ? "+" : ""}$
            {Math.abs(action.revenueImpact)}
          </span>
        )}
        <span>
          {action.blockedHours < 999
            ? `${action.blockedHours}h ago`
            : "Invalid"}
        </span>
      </div>

      {/* Action Button */}
      <button className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex-shrink-0">
        {action.actionLabel}
      </button>
    </Link>
  );
}
