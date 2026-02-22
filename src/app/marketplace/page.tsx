"use client";

import Link from "next/link";
import clsx from "clsx";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import type { Intent, Service } from "@/types";
import { apiRequest } from "@/lib/api";
import { EP } from "@/lib/api/endpoints";
import { useUIStore } from "@/store";

type MarketplaceResponse = {
  ok?: boolean;
  success?: boolean;
  services?: Service[];
  data?: Service[];
  meta?: unknown;
};

const INTENTS: Array<{ key: Intent; label: string }> = [
  { key: "all", label: "All" },
  { key: "buy", label: "Buy" },
  { key: "earn", label: "Earn" },
  { key: "rent", label: "Rent" },
  { key: "deal", label: "Deal" },
];

function getIntentHint(intent: Intent): string {
  if (intent === "buy") return "Buy-enabled services";
  if (intent === "earn") return "Apply-enabled services";
  if (intent === "rent") return "Rental services";
  if (intent === "deal") return "Deal portal services";
  return "All active services";
}

export default function MarketplacePage() {
  const intent = useUIStore((s) => s.intent);
  const setIntent = useUIStore((s) => s.setIntent);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("uremo_explore_intent") as Intent | null;
    if (saved && INTENTS.some((i) => i.key === saved) && saved !== intent) {
      setIntent(saved);
    }
  }, [intent, setIntent]);

  const query = useQuery({
    queryKey: ["marketplace", intent],
    queryFn: async () => {
      const qs =
        intent !== "all" ? `?intent=${encodeURIComponent(intent)}` : "";
      return apiRequest<MarketplaceResponse>(`${EP.SERVICES_MARKETPLACE}${qs}`);
    },
  });

  const services: Service[] = (
    query.data?.services && Array.isArray(query.data.services)
      ? query.data.services
      : query.data?.data && Array.isArray(query.data.data)
        ? query.data.data
        : []
  ) as Service[];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Marketplace</div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              {getIntentHint(intent)}
            </div>
          </div>

          <div className="inline-flex flex-wrap gap-2">
            {INTENTS.map((t) => {
              const active = t.key === intent;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setIntent(t.key)}
                  className={clsx(
                    "rounded-xl border px-3 py-2 text-xs font-semibold",
                    active
                      ? "border-[var(--border)] bg-[var(--panel-2)] text-white"
                      : "border-transparent bg-[var(--bg)] text-[var(--muted)] hover:text-white",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="text-sm font-semibold">Services</div>
          <div className="text-xs text-[var(--muted)]">
            {query.isLoading ? "Loading..." : `${services.length} result(s)`}
          </div>
        </div>

        {query.isError ? (
          <div className="px-5 py-4 text-sm text-[var(--muted)]">
            Failed to load services.
          </div>
        ) : null}

        <div className="divide-y divide-[var(--border)]">
          {services.map((s) => (
            <div key={s._id} className="flex flex-col gap-2 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/marketplace/service/${s._id}`}
                    className="block truncate text-sm font-semibold hover:underline"
                  >
                    {s.title}
                  </Link>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {s.category}
                    {s.subcategory ? ` / ${s.subcategory}` : ""} ·{" "}
                    {s.deliveryType}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold">
                    {typeof s.price === "number"
                      ? s.price.toLocaleString()
                      : "—"}{" "}
                    {s.currency || ""}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    status: {s.status}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div
                  className={clsx(
                    "rounded-xl border px-2 py-1 text-xs",
                    s.allowedActions?.buy
                      ? "border-[var(--border)] bg-[var(--panel-2)]"
                      : "border-transparent text-[var(--muted)]",
                  )}
                >
                  buy
                </div>
                <div
                  className={clsx(
                    "rounded-xl border px-2 py-1 text-xs",
                    s.allowedActions?.apply
                      ? "border-[var(--border)] bg-[var(--panel-2)]"
                      : "border-transparent text-[var(--muted)]",
                  )}
                >
                  apply
                </div>
                <div
                  className={clsx(
                    "rounded-xl border px-2 py-1 text-xs",
                    s.allowedActions?.rent
                      ? "border-[var(--border)] bg-[var(--panel-2)]"
                      : "border-transparent text-[var(--muted)]",
                  )}
                >
                  rent
                </div>
                <div
                  className={clsx(
                    "rounded-xl border px-2 py-1 text-xs",
                    s.allowedActions?.deal
                      ? "border-[var(--border)] bg-[var(--panel-2)]"
                      : "border-transparent text-[var(--muted)]",
                  )}
                >
                  deal
                </div>
              </div>
            </div>
          ))}

          {!query.isLoading && services.length === 0 ? (
            <div className="px-5 py-8 text-sm text-[var(--muted)]">
              No services found.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
