"use client";

/**
 * PATCH_34: Recommended Services Component
 * Shows personalized service recommendations based on user's interest category
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Service {
  _id: string;
  title: string;
  price: number;
  category?: string;
  imageUrl?: string;
  images?: string[];
}

const categoryLabels: Record<string, string> = {
  microjobs: "Microjob Services",
  forex_crypto: "Forex & Crypto Services",
  banks_wallets: "Bank & Wallet Services",
  general: "Popular Services",
  gig_work: "Gig Work Services",
};

const categoryApiMap: Record<string, string> = {
  microjobs: "gig_work",
  forex_crypto: "forex_crypto",
  banks_wallets: "banks_wallets",
};

export default function RecommendedServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const interestCategory = (user as any)?.interestCategory || "general";
  const apiCategory = categoryApiMap[interestCategory] || "";

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const base = getApiBaseUrl();
        const params = new URLSearchParams({ limit: "4" });
        if (apiCategory) {
          params.set("category", apiCategory);
        }

        const res = await fetch(`${base}/api/services?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        const list = data?.services || data || [];
        setServices(Array.isArray(list) ? list.slice(0, 4) : []);
      } catch {
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [apiCategory]);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="h-6 w-48 bg-white/5 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          🎯 {categoryLabels[interestCategory] || "Recommended For You"}
        </h2>
        <Link
          href={
            apiCategory
              ? `/explore-services?category=${apiCategory}`
              : "/explore-services"
          }
          className="text-sm text-blue-400 hover:text-blue-300 transition"
        >
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {services.map((service) => (
          <Link
            key={service._id}
            href={`/services/${service._id}`}
            className="group block"
          >
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.07] transition-all">
              {/* Image */}
              <div className="h-20 rounded-lg bg-gradient-to-br from-blue-500/10 to-emerald-500/10 mb-3 overflow-hidden">
                {service.imageUrl || service.images?.[0] ? (
                  <img
                    src={service.imageUrl || service.images?.[0]}
                    alt={service.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl text-white/30">
                    ✦
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 className="text-sm font-medium text-white truncate mb-1">
                {service.title}
              </h3>

              {/* Price */}
              <p className="text-sm text-emerald-400 font-semibold">
                ${service.price}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
