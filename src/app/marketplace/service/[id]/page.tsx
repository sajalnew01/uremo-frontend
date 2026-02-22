"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import type { Service } from "@/types";
import { apiRequest } from "@/lib/api";
import { EP } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store";

type ServiceDetailResponse = {
  ok?: boolean;
  success?: boolean;
  service?: Service;
  data?: Service;
} & Partial<Service>;

export default function MarketplaceServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const serviceId = params?.id;
  const router = useRouter();
  const { isLoggedIn, hydrate } = useAuthStore();

  const [dealPercent, setDealPercent] = useState<number>(10);
  const [applyMessage, setApplyMessage] = useState<string>("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () =>
      apiRequest<ServiceDetailResponse>(EP.SERVICE_BY_ID(String(serviceId))),
    enabled: Boolean(serviceId),
  });

  const service: Service | null =
    (query.data?.service as Service) ||
    (query.data?.data as Service) ||
    (query.data && (query.data as unknown as Service)._id
      ? (query.data as unknown as Service)
      : null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  function requireAuth() {
    if (isLoggedIn) return true;
    const nextPath =
      typeof window !== "undefined" ? window.location.pathname : "/marketplace";
    router.push(`/login?next=${encodeURIComponent(nextPath)}`);
    return false;
  }

  const buyMutation = useMutation({
    mutationFn: async (svcId: string) =>
      apiRequest<{ ok: boolean; orderId: string; order: unknown }>(
        EP.ORDERS,
        "POST",
        { serviceId: svcId },
        true,
      ),
    onSuccess: (data) => {
      setActionMsg(`Order created: ${data.orderId}`);
      router.push("/marketplace/orders");
    },
    onError: (e) => {
      setActionMsg(e instanceof Error ? e.message : "Failed to create order");
    },
  });

  const dealMutation = useMutation({
    mutationFn: async (payload: { serviceId: string; dealPercent: number }) =>
      apiRequest<{ ok: boolean; orderId: string; order: unknown }>(
        EP.ORDERS_DEAL,
        "POST",
        payload,
        true,
      ),
    onSuccess: (data) => {
      setActionMsg(`Deal order created: ${data.orderId}`);
      router.push("/marketplace/orders");
    },
    onError: (e) => {
      setActionMsg(
        e instanceof Error ? e.message : "Failed to create deal order",
      );
    },
  });

  const rentMutation = useMutation({
    mutationFn: async (payload: { serviceId: string; planIndex: number }) =>
      apiRequest<{
        ok: boolean;
        message?: string;
        rental?: { _id: string; status: string };
        order?: { _id: string; status: string };
      }>(EP.RENTALS_CREATE, "POST", payload, true),
    onSuccess: (data) => {
      setActionMsg(data.message || "Rental order created");
      router.push("/marketplace/rentals");
    },
    onError: (e) => {
      setActionMsg(
        e instanceof Error ? e.message : "Failed to create rental order",
      );
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (payload: { jobId: string; message?: string }) =>
      apiRequest<{ ok: boolean; message?: string; application?: unknown }>(
        EP.WORKSPACE_APPLY(payload.jobId),
        "POST",
        { message: payload.message || "" },
        true,
      ),
    onSuccess: (data) => {
      setActionMsg(data.message || "Application submitted");
      router.push("/workforce");
    },
    onError: (e) => {
      setActionMsg(e instanceof Error ? e.message : "Failed to apply");
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Service</div>
            <div className="mt-1 text-sm text-[var(--muted)]">{serviceId}</div>
          </div>
          <Link
            href="/marketplace"
            className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        {query.isLoading ? (
          <div className="text-sm text-[var(--muted)]">Loading...</div>
        ) : query.isError ? (
          <div className="text-sm text-[var(--muted)]">
            Failed to load service.
          </div>
        ) : !service ? (
          <div className="text-sm text-[var(--muted)]">Service not found.</div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-lg font-semibold tracking-tight">
                {service.title}
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                {service.category}
                {service.subcategory ? ` / ${service.subcategory}` : ""} ·{" "}
                {service.deliveryType}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Price
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {service.price?.toLocaleString?.() ?? service.price}{" "}
                  {service.currency}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Allowed Actions
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1">
                    buy: {service.allowedActions?.buy ? "yes" : "no"}
                  </span>
                  <span className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1">
                    apply: {service.allowedActions?.apply ? "yes" : "no"}
                  </span>
                  <span className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1">
                    rent: {service.allowedActions?.rent ? "yes" : "no"}
                  </span>
                  <span className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1">
                    deal: {service.allowedActions?.deal ? "yes" : "no"}
                  </span>
                </div>
              </div>
            </div>

            {service.isRental ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Rental Plans
                </div>
                <div className="mt-2 space-y-2">
                  {(service.rentalPlans || []).map((p, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2"
                    >
                      <div className="text-sm font-semibold">{p.label}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {p.duration} days · {p.type} · ${p.price}
                      </div>
                    </div>
                  ))}
                  {!service.rentalPlans || service.rentalPlans.length === 0 ? (
                    <div className="text-sm text-[var(--muted)]">
                      No plans configured.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Action Dock
                  </div>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    Execute only actions allowed by backend rules.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      !service.allowedActions?.buy || buyMutation.isPending
                    }
                    onClick={() => {
                      setActionMsg(null);
                      if (!requireAuth()) return;
                      buyMutation.mutate(service._id);
                    }}
                    className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    {buyMutation.isPending ? "Creating..." : "Buy"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      !service.allowedActions?.apply || applyMutation.isPending
                    }
                    onClick={() => {
                      setActionMsg(null);
                      if (!requireAuth()) return;
                      if (!service.linkedJobId) {
                        setActionMsg(
                          "Apply not available (missing linked job)",
                        );
                        return;
                      }
                      applyMutation.mutate({
                        jobId: service.linkedJobId,
                        message: applyMessage.trim() || undefined,
                      });
                    }}
                    className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    {applyMutation.isPending ? "Submitting..." : "Apply"}
                  </button>
                </div>
              </div>

              {service.allowedActions?.apply ? (
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Application Message (optional)
                  </div>
                  <textarea
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm outline-none"
                    rows={3}
                    placeholder="Add a short message..."
                  />
                </div>
              ) : null}

              {service.allowedActions?.deal ? (
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Deal</div>
                      <div className="text-xs text-[var(--muted)]">
                        Create a deal order with a percent.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={dealPercent}
                        onChange={(e) => setDealPercent(Number(e.target.value))}
                        className="w-20 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none"
                      />
                      <button
                        type="button"
                        disabled={dealMutation.isPending}
                        onClick={() => {
                          setActionMsg(null);
                          if (!requireAuth()) return;
                          dealMutation.mutate({
                            serviceId: service._id,
                            dealPercent,
                          });
                        }}
                        className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                      >
                        {dealMutation.isPending ? "Creating..." : "Create Deal"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {service.allowedActions?.rent && service.isRental ? (
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3">
                  <div className="text-sm font-semibold">Rent</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Select a plan to create a rental order.
                  </div>
                  <div className="mt-3 grid gap-2">
                    {(service.rentalPlans || []).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={rentMutation.isPending}
                        onClick={() => {
                          setActionMsg(null);
                          if (!requireAuth()) return;
                          rentMutation.mutate({
                            serviceId: service._id,
                            planIndex: idx,
                          });
                        }}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-left text-sm disabled:opacity-50"
                      >
                        <span className="font-semibold">{p.label}</span>
                        <span className="text-xs text-[var(--muted)]">
                          {p.duration} days · {p.type} · ${p.price}
                        </span>
                      </button>
                    ))}
                    {(!service.rentalPlans ||
                      service.rentalPlans.length === 0) && (
                      <div className="text-sm text-[var(--muted)]">
                        No plans available.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {actionMsg ? (
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--muted)]">
                  {actionMsg}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
