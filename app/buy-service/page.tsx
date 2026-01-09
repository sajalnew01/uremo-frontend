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
    <div className="px-6 py-10">
      <h1 className="text-2xl font-bold mb-2">Available Services</h1>
      <p className="text-slate-500 mb-6">
        All services below are manually reviewed and fulfilled by the UREMO
        team.
      </p>

      {services.length === 0 ? (
        <p className="opacity-60">No services available.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((s: any) => (
            <div
              key={s._id}
              className="border rounded-xl p-5 bg-[#0f172a] text-white"
            >
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="text-sm opacity-70 mt-1">{s.shortDescription}</p>

              <div className="flex justify-between items-center mt-4">
                <span className="font-bold">${s.price}</span>
                <Link
                  href={`/services/${s._id}`}
                  className="text-blue-400 hover:underline"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
