"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { useRequireAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store";
import { Badge } from "@/design-system";
import Link from "next/link";
import type { Order, Rental, WalletBalance } from "@/types";

export default function DashboardPage() {
  const ready = useRequireAuth();
  const { user } = useAuthStore();

  const { data: ordersData } = useQuery<{ orders: Order[] }>({
    queryKey: ["my-orders"],
    queryFn: () => apiRequest(EP.ORDERS_MY, "GET", undefined, true),
    enabled: ready,
  });

  const { data: rentalsData } = useQuery<{ rentals: Rental[] }>({
    queryKey: ["my-rentals"],
    queryFn: () => apiRequest(EP.RENTALS_MY, "GET", undefined, true),
    enabled: ready,
  });

  const { data: wallet } = useQuery<WalletBalance>({
    queryKey: ["wallet-balance"],
    queryFn: () => apiRequest(EP.WALLET_BALANCE, "GET", undefined, true),
    enabled: ready,
  });

  if (!ready) return null;

  const activeOrders = ordersData?.orders?.filter((o) => o.status !== "completed" && o.status !== "cancelled") || [];
  const activeRentals = rentalsData?.rentals?.filter((r) => r.status === "active") || [];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.name || "User"}</h1>
        <p className="page-subtitle">Your UREMO dashboard overview.</p>
      </div>

      {/* Stats Row */}
      <div className="u-grid u-grid-4" style={{ marginBottom: "var(--space-8)" }}>
        <div className="stat-card">
          <div className="stat-card-label">Wallet Balance</div>
          <div className="stat-card-value" style={{ color: "var(--color-brand)" }}>
            ${wallet?.balance?.toFixed(2) || "0.00"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Active Orders</div>
          <div className="stat-card-value">{activeOrders.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Active Rentals</div>
          <div className="stat-card-value">{activeRentals.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Lifetime Earnings</div>
          <div className="stat-card-value" style={{ color: "var(--color-success)" }}>
            ${wallet?.lifetimeEarnings?.toFixed(2) || "0.00"}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="page-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h2 className="u-heading-2">Recent Orders</h2>
          <Link href="/explore" className="u-btn u-btn-secondary u-btn-sm">Browse Services</Link>
        </div>
        {!ordersData?.orders?.length ? (
          <div className="u-card" style={{ textAlign: "center", color: "var(--color-text-tertiary)" }}>
            No orders yet. <Link href="/explore" style={{ color: "var(--color-brand)" }}>Explore services</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {ordersData.orders.slice(0, 5).map((order) => {
              const svc = typeof order.serviceId === "object" ? order.serviceId : null;
              return (
                <Link
                  key={order._id}
                  href={`/orders/${order._id}`}
                  className="u-card"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit" }}
                >
                  <div>
                    <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)" }}>
                      {svc?.title || "Order"}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                      {order.orderType} · {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <Badge status={order.status} />
                    <Badge status={order.paymentStatus} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Rentals */}
      {activeRentals.length > 0 && (
        <div className="page-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <h2 className="u-heading-2">Active Rentals</h2>
            <Link href="/rentals" className="u-btn u-btn-secondary u-btn-sm">View All</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {activeRentals.slice(0, 3).map((rental) => {
              const svc = typeof rental.service === "object" ? rental.service : null;
              return (
                <div key={rental._id} className="u-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)" }}>
                      {svc?.title || "Rental"}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                      Expires {new Date(rental.endDate).toLocaleDateString()}
                      {rental.daysRemaining != null && ` (${rental.daysRemaining}d left)`}
                    </div>
                  </div>
                  <Badge status={rental.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
