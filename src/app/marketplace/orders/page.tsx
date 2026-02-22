"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useRequireAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { EP } from "@/lib/api/endpoints";
import type { Order, Service } from "@/types";

type OrdersResponse = Order[];

function getServiceTitle(serviceId: Order["serviceId"]): string {
  if (!serviceId) return "Service";
  if (typeof serviceId === "string") return serviceId;
  return (serviceId as Service).title || "Service";
}

function getServiceIdStr(serviceId: Order["serviceId"]): string | null {
  if (!serviceId) return null;
  if (typeof serviceId === "string") return serviceId;
  return (serviceId as Service)._id || null;
}

export default function MarketplaceOrdersPage() {
  const ok = useRequireAuth();
  if (!ok) return null;

  const query = useQuery({
    queryKey: ["orders", "my"],
    queryFn: async () =>
      apiRequest<OrdersResponse>(EP.ORDERS_MY, "GET", undefined, true),
  });

  const orders = Array.isArray(query.data) ? query.data : [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Orders</div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              Your marketplace orders (buy / rental / deal)
            </div>
          </div>
          <Link
            href="/marketplace"
            className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
          >
            Back
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/finance/wallet"
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white"
          >
            → Wallet
          </Link>
          <Link
            href="/marketplace/rentals"
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white"
          >
            → Rentals
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="text-sm font-semibold">My Orders</div>
          <div className="text-xs text-[var(--muted)]">
            {query.isLoading ? "Loading..." : `${orders.length} order(s)`}
          </div>
        </div>

        {query.isError ? (
          <div className="px-5 py-4 text-sm text-[var(--muted)]">
            Failed to load orders.
          </div>
        ) : null}

        <div className="divide-y divide-[var(--border)]">
          {orders.map((o) => {
            const svcId = getServiceIdStr(o.serviceId);
            return (
              <div key={o._id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    {svcId ? (
                      <Link
                        href={`/marketplace/service/${svcId}`}
                        className="truncate text-sm font-semibold hover:text-[var(--accent)]"
                      >
                        {getServiceTitle(o.serviceId)} →
                      </Link>
                    ) : (
                      <div className="truncate text-sm font-semibold">
                        {getServiceTitle(o.serviceId)}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      id: {o._id} · type: {o.orderType} · status: {o.status}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-xs text-[var(--muted)]">
                      payment: {o.paymentStatus}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      created: {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!query.isLoading && orders.length === 0 ? (
            <div className="px-5 py-8 text-sm text-[var(--muted)]">
              No orders yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
