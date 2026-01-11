"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";

export default function BuyServicePage() {
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    apiRequest("/api/services").then(setServices).catch(console.error);
  }, []);

  return (
    <div className="u-container">
      <h1 className="text-3xl font-bold mb-2">Available Services</h1>
      <p className="text-slate-400 mb-8">
        All services below are manually reviewed and fulfilled by the UREMO
        team.
      </p>

      {services.length === 0 ? (
        <p className="opacity-70 text-slate-300">No services available.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((s: any) => (
            <Link key={s._id} href={`/services/${s._id}`} className="block">
              <div className="card cursor-pointer">
                {Array.isArray(s.images) && s.images[0] && (
                  <div className="mb-4 overflow-hidden rounded-xl border border-white/10">
                    <img
                      src={s.images[0]}
                      alt={s.title}
                      className="h-44 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

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
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-emerald-300">
                      ${s.price}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">USD</p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mt-4 line-clamp-3">
                  {s.shortDescription || s.description}
                </p>

                <div className="mt-6 flex justify-end">
                  <span className="btn-primary">View service</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
