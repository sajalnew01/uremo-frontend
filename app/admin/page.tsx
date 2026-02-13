"use client";

/**
 * PATCH_97: Admin Dashboard — Overview Metrics + Action Queue
 *
 * 4 metric blocks at the top:
 *  1. Marketplace (services, orders today, revenue)
 *  2. Workforce (active workers, projects, screenings)
 *  3. AI Data / RLHF (datasets, tasks completed)
 *  4. Finance (users, pending withdrawals, payments)
 *
 * Below: Full ActionQueue for pending actions.
 */

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import ActionQueuePage from "@/components/admin/v2/ActionQueuePage";

interface DashboardMetrics {
  marketplace: {
    totalServices: number;
    ordersToday: number;
    revenueToday: number;
  };
  workforce: {
    activeWorkers: number;
    totalProjects: number;
    pendingScreenings: number;
  };
  rlhf: {
    totalDatasets: number;
    tasksCompleted: number;
    pendingReviews: number;
  };
  finance: {
    totalUsers: number;
    pendingWithdrawals: number;
    pendingPayments: number;
  };
}

function MetricBlock({
  title,
  icon,
  color,
  metrics,
}: {
  title: string;
  icon: string;
  color: string;
  metrics: { label: string; value: string | number }[];
}) {
  return (
    <div className={`rounded-2xl border p-5 ${color}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="font-semibold text-white text-sm">{title}</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="text-center">
            <p className="text-xl font-bold text-white">{m.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const [
        ordersRes,
        workersRes,
        servicesRes,
        datasetsRes,
        usersRes,
        withdrawalsRes,
      ] = await Promise.allSettled([
        apiRequest("/api/admin/orders", "GET", null, true),
        apiRequest("/api/admin/workspace/workers", "GET", null, true),
        apiRequest("/api/admin/services", "GET", null, true),
        apiRequest("/api/admin/datasets", "GET", null, true),
        apiRequest("/api/admin/users?limit=100", "GET", null, true),
        apiRequest("/api/admin/affiliate/withdrawals", "GET", null, true),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const orders =
        ordersRes.status === "fulfilled"
          ? Array.isArray(ordersRes.value)
            ? ordersRes.value
            : ordersRes.value?.orders || []
          : [];
      const ordersToday = orders.filter(
        (o: any) => new Date(o.createdAt) >= today,
      ).length;
      const revenueToday = orders
        .filter(
          (o: any) =>
            new Date(o.createdAt) >= today && o.status !== "cancelled",
        )
        .reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
      const pendingPayments = orders.filter(
        (o: any) => o.status === "payment_pending",
      ).length;

      const workers =
        workersRes.status === "fulfilled"
          ? Array.isArray(workersRes.value)
            ? workersRes.value
            : workersRes.value?.workers || []
          : [];
      const activeWorkers = workers.filter((w: any) => w.isActive).length;

      const services =
        servicesRes.status === "fulfilled"
          ? Array.isArray(servicesRes.value)
            ? servicesRes.value
            : servicesRes.value?.services || []
          : [];

      const datasets =
        datasetsRes.status === "fulfilled"
          ? Array.isArray(datasetsRes.value)
            ? datasetsRes.value
            : datasetsRes.value?.datasets || []
          : [];
      const tasksCompleted = datasets.reduce(
        (sum: number, d: any) => sum + (d.completedTasks || 0),
        0,
      );
      const pendingReviews = datasets.reduce(
        (sum: number, d: any) => sum + (d.pendingReviews || 0),
        0,
      );

      const users =
        usersRes.status === "fulfilled"
          ? Array.isArray(usersRes.value)
            ? usersRes.value
            : usersRes.value?.users || []
          : [];

      const withdrawals =
        withdrawalsRes.status === "fulfilled"
          ? Array.isArray(withdrawalsRes.value)
            ? withdrawalsRes.value
            : withdrawalsRes.value?.withdrawals || []
          : [];
      const pendingWithdrawals = withdrawals.filter(
        (w: any) => w.status === "pending",
      ).length;

      const totalProjects = workers.reduce(
        (sum: number, w: any) =>
          sum +
          (w.assignedProjects?.length || 0) +
          (w.completedProjects?.length || 0),
        0,
      );

      setMetrics({
        marketplace: {
          totalServices: services.length,
          ordersToday,
          revenueToday,
        },
        workforce: {
          activeWorkers,
          totalProjects,
          pendingScreenings: 0,
        },
        rlhf: {
          totalDatasets: datasets.length,
          tasksCompleted,
          pendingReviews,
        },
        finance: {
          totalUsers: users.length,
          pendingWithdrawals,
          pendingPayments,
        },
      });
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PATCH_97: Overview Metrics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 p-5 animate-pulse"
            >
              <div className="h-6 w-1/2 bg-white/10 rounded mb-4" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-10 bg-white/10 rounded" />
                <div className="h-10 bg-white/10 rounded" />
                <div className="h-10 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricBlock
            title="Marketplace"
            icon="🏪"
            color="border-blue-500/30 bg-blue-500/5"
            metrics={[
              { label: "Services", value: metrics.marketplace.totalServices },
              { label: "Orders Today", value: metrics.marketplace.ordersToday },
              {
                label: "Revenue Today",
                value: `$${metrics.marketplace.revenueToday.toFixed(0)}`,
              },
            ]}
          />
          <MetricBlock
            title="Workforce"
            icon="👷"
            color="border-emerald-500/30 bg-emerald-500/5"
            metrics={[
              {
                label: "Active Workers",
                value: metrics.workforce.activeWorkers,
              },
              { label: "Projects", value: metrics.workforce.totalProjects },
              {
                label: "Screenings",
                value: metrics.workforce.pendingScreenings,
              },
            ]}
          />
          <MetricBlock
            title="AI Data / RLHF"
            icon="🧠"
            color="border-purple-500/30 bg-purple-500/5"
            metrics={[
              { label: "Datasets", value: metrics.rlhf.totalDatasets },
              { label: "Tasks Done", value: metrics.rlhf.tasksCompleted },
              { label: "Pending QA", value: metrics.rlhf.pendingReviews },
            ]}
          />
          <MetricBlock
            title="Finance"
            icon="💰"
            color="border-amber-500/30 bg-amber-500/5"
            metrics={[
              { label: "Users", value: metrics.finance.totalUsers },
              {
                label: "Withdrawals",
                value: metrics.finance.pendingWithdrawals,
              },
              { label: "Payments", value: metrics.finance.pendingPayments },
            ]}
          />
        </div>
      ) : null}

      {/* Action Queue below */}
      <ActionQueuePage />
    </div>
  );
}
