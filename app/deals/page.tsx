"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { withCacheBust } from "@/lib/cacheBust";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";

type Service = {
  _id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  images?: string[];
  updatedAt?: string;
  category?: string;
  subcategory?: string;
  allowedActions?: {
    buy?: boolean;
    apply?: boolean;
    rent?: boolean;
    deal?: boolean;
  };
};

export default function DealsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    apiRequest("/api/services/deals", "GET")
      .then((data: any) => {
        if (!mounted) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.services)
            ? data.services
            : [];
        setServices(list);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.message || "Failed to load deals");
        setServices([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="u-container max-w-6xl">
      <PageHeader
        title="Deals"
        description="Bank & crypto services eligible for deal completion"
        actionLabel="Explore Services"
        actionHref="/explore-services"
      />

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card">
              <div className="h-36 rounded-xl bg-white/10 animate-pulse" />
              <div className="mt-4 h-5 w-3/4 rounded bg-white/10 animate-pulse" />
              <div className="mt-2 h-4 w-2/3 rounded bg-white/10 animate-pulse" />
              <div className="mt-4 h-4 w-1/2 rounded bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="card">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {!loading && !error && services.length === 0 && (
        <EmptyState
          icon="🎷️"
          title="No deals available yet"
          description="Check back later for exclusive deals on services."
          ctaText="Explore Services"
          ctaHref="/explore-services"
        />
      )}

      {!loading && !error && services.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <Link
              key={s._id}
              href={`/services/${s._id}`}
              className="block group"
            >
              <div className="card overflow-hidden h-full flex flex-col hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all">
                <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/15 via-white/5 to-emerald-500/10 aspect-video">
                  {s.imageUrl || (Array.isArray(s.images) && s.images[0]) ? (
                    <img
                      src={withCacheBust(
                        s.imageUrl || s.images?.[0],
                        s.updatedAt || s._id,
                      )}
                      alt={s.title}
                      className="h-full w-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white/70">
                      <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-xl">
                        ✦
                      </div>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-white truncate">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300 line-clamp-2 flex-1">
                  {s.description || ""}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {s.allowedActions?.buy && (
                    <span className="text-[11px] rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-1 text-blue-200">
                      Buy
                    </span>
                  )}
                  {s.allowedActions?.rent && (
                    <span className="text-[11px] rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 py-1 text-purple-200">
                      Rent
                    </span>
                  )}
                  {s.allowedActions?.deal && (
                    <span className="text-[11px] rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-amber-200">
                      Deal
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-4 flex justify-end">
                  <span className="inline-flex items-center gap-2 text-sm text-slate-200 group-hover:text-white transition">
                    View{" "}
                    <span className="text-[#9CA3AF] group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
