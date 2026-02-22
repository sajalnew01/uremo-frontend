"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useRequireAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { EP } from "@/lib/api/endpoints";
import type { Rental, Service } from "@/types";

type RentalsResponse = {
  ok: boolean;
  rentals: Rental[];
  counts?: { total: number; active: number; expired: number; pending: number };
};

function getServiceId(service: Rental["service"]): string {
  if (!service) return "";
  if (typeof service === "string") return service;
  return (service as Service)._id;
}

function getServiceTitle(service: Rental["service"]): string {
  if (!service) return "Service";
  if (typeof service === "string") return service;
  return (service as Service).title || "Service";
}

export default function MarketplaceRentalsPage() {
  const ok = useRequireAuth();
  if (!ok) return null;

  const qc = useQueryClient();
  const [renewOpenId, setRenewOpenId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["rentals", "my"],
    queryFn: async () =>
      apiRequest<RentalsResponse>(EP.RENTALS_MY, "GET", undefined, true),
  });

  const rentals =
    query.data?.rentals && Array.isArray(query.data.rentals)
      ? query.data.rentals
      : [];
  const active = useMemo(
    () => rentals.filter((r) => r.status === "active"),
    [rentals],
  );
  const expiringSoon = useMemo(
    () =>
      rentals.filter((r) => r.status === "active" && (r as any).isExpiringSoon),
    [rentals],
  );

  const cancelMutation = useMutation({
    mutationFn: async (payload: { id: string }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        EP.RENTAL_CANCEL(payload.id),
        "PUT",
        { reason: "Cancelled by user" },
        true,
      ),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["rentals", "my"] });
    },
  });

  const renewMutation = useMutation({
    mutationFn: async (payload: { id: string; planIndex: number }) =>
      apiRequest<{ ok: boolean; message?: string }>(
        EP.RENTAL_RENEW(payload.id),
        "POST",
        { planIndex: payload.planIndex },
        true,
      ),
    onSuccess: async () => {
      setRenewOpenId(null);
      await qc.invalidateQueries({ queryKey: ["rentals", "my"] });
      await qc.invalidateQueries({ queryKey: ["orders", "my"] });
    },
  });

  const renewalServiceId = renewOpenId
    ? (() => {
        const rental = rentals.find((r) => r._id === renewOpenId);
        return rental ? getServiceId(rental.service) : "";
      })()
    : "";

  const serviceQuery = useQuery({
    queryKey: ["service", renewalServiceId],
    queryFn: async () => apiRequest<any>(EP.SERVICE_BY_ID(renewalServiceId)),
    enabled: Boolean(renewOpenId && renewalServiceId),
  });

  const renewalService: Service | null =
    (serviceQuery.data?.service as Service) ||
    (serviceQuery.data?.data as Service) ||
    (serviceQuery.data && (serviceQuery.data as Service)._id
      ? (serviceQuery.data as Service)
      : null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Rentals</div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              Active subscriptions and renewals
            </div>
          </div>
          <Link
            href="/marketplace"
            className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
          >
            Back
          </Link>
        </div>
      </div>

      {active.length > 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="text-sm font-semibold">Active Rentals</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            {active.length} active · {expiringSoon.length} expiring soon
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="text-sm font-semibold">My Rentals</div>
          <div className="text-xs text-[var(--muted)]">
            {query.isLoading ? "Loading..." : `${rentals.length} rental(s)`}
          </div>
        </div>

        {query.isError ? (
          <div className="px-5 py-4 text-sm text-[var(--muted)]">
            Failed to load rentals.
          </div>
        ) : null}

        <div className="divide-y divide-[var(--border)]">
          {rentals.map((r) => {
            const computedStatus = (r as any).computedStatus || r.status;
            const daysRemaining = (r as any).daysRemaining as
              | number
              | undefined;
            const canCancel = ["pending", "active"].includes(r.status);
            const canRenew = ["active", "expired"].includes(r.status);

            return (
              <div key={r._id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {getServiceTitle(r.service)}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      id: {r._id} · status: {computedStatus}
                      {typeof daysRemaining === "number"
                        ? ` · ${daysRemaining} day(s) remaining`
                        : ""}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!canCancel || cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate({ id: r._id })}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!canRenew}
                      onClick={() =>
                        setRenewOpenId((cur) => (cur === r._id ? null : r._id))
                      }
                      className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      Renew
                    </button>
                  </div>
                </div>

                {renewOpenId === r._id ? (
                  <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div className="text-sm font-semibold">
                      Select renewal plan
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      Backend requires a plan index.
                    </div>

                    {serviceQuery.isLoading ? (
                      <div className="mt-3 text-sm text-[var(--muted)]">
                        Loading plans...
                      </div>
                    ) : serviceQuery.isError || !renewalService ? (
                      <div className="mt-3 text-sm text-[var(--muted)]">
                        Failed to load rental plans for renewal.
                      </div>
                    ) : (
                      <div className="mt-3 grid gap-2">
                        {(renewalService.rentalPlans || []).map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            disabled={renewMutation.isPending}
                            onClick={() =>
                              renewMutation.mutate({
                                id: r._id,
                                planIndex: idx,
                              })
                            }
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-left text-sm disabled:opacity-50"
                          >
                            <span className="font-semibold">{p.label}</span>
                            <span className="text-xs text-[var(--muted)]">
                              {p.duration} days · {p.type} · ${p.price}
                            </span>
                          </button>
                        ))}
                        {(!renewalService.rentalPlans ||
                          renewalService.rentalPlans.length === 0) && (
                          <div className="text-sm text-[var(--muted)]">
                            No plans configured.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}

          {!query.isLoading && rentals.length === 0 ? (
            <div className="px-5 py-8 text-sm text-[var(--muted)]">
              No rentals yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
