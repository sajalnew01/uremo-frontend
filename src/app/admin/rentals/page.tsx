"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequireAdmin } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { EP } from "@/lib/api/endpoints";
import type { Rental, Service } from "@/types";

type AdminRentalsResponse = {
  ok?: boolean;
  success?: boolean;
  rentals?: Rental[];
  data?: Rental[];
};

type MetricsResponse = {
  ok?: boolean;
  success?: boolean;
  metrics?: {
    total: number;
    active: number;
    expired: number;
    pending: number;
    cancelled: number;
  };
  data?: {
    total: number;
    active: number;
    expired: number;
    pending: number;
    cancelled: number;
  };
};

function getServiceTitle(service: Rental["service"]): string {
  if (!service) return "—";
  if (typeof service === "string") return service;
  return (service as Service).title || service.toString();
}

function getUserEmail(user: Rental["user"]): string {
  if (!user) return "—";
  if (typeof user === "string") return user;
  return (user as { email: string }).email || user.toString();
}

export default function AdminRentalsPage() {
  const ok = useRequireAdmin();
  if (!ok) return null;

  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const metricsQuery = useQuery({
    queryKey: ["admin", "rentals", "metrics"],
    queryFn: async () => {
      const res = await apiRequest<MetricsResponse>(
        EP.ADMIN_RENTALS_METRICS,
        "GET",
        undefined,
        true,
      );
      return (
        res.metrics ??
        res.data ?? {
          total: 0,
          active: 0,
          expired: 0,
          pending: 0,
          cancelled: 0,
        }
      );
    },
  });

  const rentalsQuery = useQuery({
    queryKey: ["admin", "rentals", statusFilter],
    queryFn: async () => {
      const url =
        statusFilter === "all"
          ? EP.ADMIN_RENTALS
          : `${EP.ADMIN_RENTALS}?status=${statusFilter}`;
      const res = await apiRequest<AdminRentalsResponse>(
        url,
        "GET",
        undefined,
        true,
      );
      return res.rentals ?? res.data ?? [];
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest<{ ok: boolean; message?: string }>(
        EP.ADMIN_RENTAL_ACTIVATE(id),
        "PUT",
        undefined,
        true,
      ),
    onSuccess: (res) => {
      setActionMsg(res.message || "Rental activated");
      qc.invalidateQueries({ queryKey: ["admin", "rentals"] });
    },
    onError: (e) => setActionMsg(e instanceof Error ? e.message : "Failed"),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest<{ ok: boolean; message?: string }>(
        EP.ADMIN_RENTAL_CANCEL(id),
        "PUT",
        { reason: "Admin cancellation" },
        true,
      ),
    onSuccess: (res) => {
      setActionMsg(res.message || "Rental cancelled");
      qc.invalidateQueries({ queryKey: ["admin", "rentals"] });
    },
    onError: (e) => setActionMsg(e instanceof Error ? e.message : "Failed"),
  });

  const rentals = rentalsQuery.data ?? [];
  const metrics = metricsQuery.data;
  const statuses = ["all", "pending", "active", "expired", "cancelled"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="text-sm font-semibold">Admin · Rentals</div>
        <div className="mt-1 text-sm text-[var(--muted)]">
          Manage rental activations, renewals, and expirations.
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(
            ["total", "active", "pending", "expired", "cancelled"] as const
          ).map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {key}
              </div>
              <div className="mt-2 text-lg font-semibold">
                {metrics[key] ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
              statusFilter === s
                ? "border-[var(--accent)] bg-[var(--panel-2)] text-white"
                : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] hover:text-white"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--muted)]">
          {actionMsg}
        </div>
      )}

      {/* Rentals list */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="text-sm font-semibold">Rentals</div>
          <div className="text-xs text-[var(--muted)]">
            {rentalsQuery.isLoading
              ? "Loading..."
              : `${rentals.length} rental(s)`}
          </div>
        </div>

        {rentalsQuery.isError && (
          <div className="px-5 py-4 text-sm text-[var(--muted)]">
            Failed to load rentals.
          </div>
        )}

        <div className="divide-y divide-[var(--border)]">
          {rentals.map((r) => (
            <div key={r._id} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {getServiceTitle(r.service)}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    User: {getUserEmail(r.user)} · Status: {r.status} ·
                    Duration: {r.duration} days
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--muted)]">
                    ID: {r._id} · Price: {r.price} · Renewals: {r.renewalCount}
                  </div>
                  {r.endDate && (
                    <div className="mt-0.5 text-xs text-[var(--muted)]">
                      End: {new Date(r.endDate).toLocaleDateString()}{" "}
                      {typeof r.daysRemaining === "number"
                        ? `(${r.daysRemaining}d left)`
                        : ""}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {r.status === "pending" && (
                    <button
                      type="button"
                      disabled={activateMutation.isPending}
                      onClick={() => activateMutation.mutate(r._id)}
                      className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold text-[var(--success)] disabled:opacity-50"
                    >
                      Activate
                    </button>
                  )}
                  {["pending", "active"].includes(r.status) && (
                    <button
                      type="button"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(r._id)}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--danger)] disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!rentalsQuery.isLoading && rentals.length === 0 && (
            <div className="px-5 py-8 text-sm text-[var(--muted)]">
              No rentals found for filter: {statusFilter}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
