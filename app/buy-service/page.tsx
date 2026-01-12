"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";

type Service = {
  _id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  deliveryType?: string;
  price: number;
  currency?: string;
  images?: string[];
  active?: boolean;
};

export default function BuyServicePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiRequest<Service[]>("/api/services")
      .then((data) => {
        if (!mounted) return;
        setServices(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted) return;
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

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of services) {
      if (s?.category) set.add(String(s.category));
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [services]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services
      .filter((s) => (activeOnly ? s.active !== false : true))
      .filter((s) =>
        category === "all" ? true : String(s.category) === category
      )
      .filter((s) => {
        if (!q) return true;
        const hay = `${s.title || ""} ${s.category || ""} ${
          s.shortDescription || ""
        } ${s.description || ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [services, query, category, activeOnly]);

  return (
    <div className="u-container">
      <div className="mb-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Choose a service
            </h1>
            <p className="text-slate-300 max-w-2xl">
              Premium manual operations for onboarding, verification, and
              account support.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-[#9CA3AF]">
            <span className="u-pill text-slate-200">Manual processing</span>
            <span className="u-pill text-slate-200">Order chat</span>
            <span className="u-pill text-slate-200">Status tracking</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px_190px] items-stretch">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services (title, category, description)…"
              className="u-input placeholder:text-slate-400"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="u-select"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setActiveOnly((v) => !v)}
            className={`rounded-xl border px-4 py-3 text-sm transition ${
              activeOnly
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-200"
                : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
            }`}
          >
            {activeOnly ? "Active only" : "Show all"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="h-40 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
              <div className="mt-4 h-4 w-2/3 bg-white/5 rounded animate-pulse" />
              <div className="mt-3 h-3 w-1/2 bg-white/5 rounded animate-pulse" />
              <div className="mt-6 h-10 w-32 bg-white/5 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <h3 className="text-lg font-semibold">No services found</h3>
          <p className="text-sm text-slate-300 mt-2">
            Try a different search, switch category, or show all services.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setActiveOnly(true);
              }}
              className="btn-secondary w-full sm:w-auto"
            >
              Reset filters
            </button>
            <Link href="/signup" className="btn-primary w-full sm:w-auto">
              Get Started
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((s) => (
            <Link
              key={s._id}
              href={`/services/${s._id}`}
              className="block group"
            >
              <div className="card cursor-pointer overflow-hidden">
                <div className="relative">
                  <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-white/5 to-emerald-500/10">
                    {Array.isArray(s.images) && s.images[0] ? (
                      <img
                        src={s.images[0]}
                        alt={s.title}
                        className="h-44 w-full object-cover opacity-90 group-hover:opacity-100 transition"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-44 w-full flex items-center justify-center text-white/70">
                        <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-xl">
                          ✦
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-xs border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 font-semibold">
                      ${s.price}
                    </span>
                  </div>

                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-slate-200">
                      Manual
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-white truncate">
                      {s.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {s.category && (
                        <span className="u-pill text-slate-200">
                          {s.category}
                        </span>
                      )}
                      {s.deliveryType && (
                        <span className="u-pill text-slate-200">
                          {String(s.deliveryType).replace(/_/g, " ")}
                        </span>
                      )}
                      {s.active === false && (
                        <span className="u-pill text-slate-200">Inactive</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-[#9CA3AF]">from</p>
                    <p className="text-2xl font-bold text-emerald-300">
                      ${s.price}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mt-4 line-clamp-3">
                  {s.shortDescription || s.description}
                </p>

                <div className="mt-6 flex justify-end">
                  <span className="inline-flex items-center gap-2 text-sm text-slate-200 group-hover:text-white transition">
                    View details <span className="text-[#9CA3AF]">→</span>
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
