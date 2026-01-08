"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function BuyServicePage() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadServices = async () => {
    try {
      const data = await apiRequest("/api/services", "GET");
      setServices(data);
    } catch {
      alert("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const buyService = async (serviceId: string) => {
    try {
      const order = await apiRequest(
        "/api/orders",
        "POST",
        { serviceId },
        true
      );

      router.push(`/payment/${order._id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create order");
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const categories = [
    "all",
    ...Array.from(new Set(services.map((s) => s.category))),
  ];

  const filtered =
    selectedCategory === "all"
      ? services
      : services.filter((s) => s.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F172A]">
          Available Services
        </h1>
        <p className="text-[#64748B] mt-2 max-w-2xl">
          Choose a service based on your requirement. All services are manually
          reviewed and handled by our operations team.
        </p>
      </div>

      {/* CATEGORY FILTER */}
      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm border transition ${
              selectedCategory === cat
                ? "bg-[#2563EB] text-white border-[#2563EB]"
                : "border-slate-300 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* LOADING */}
      {loading && <p>Loading services…</p>}

      {/* SERVICES GRID */}
      <div className="grid md:grid-cols-3 gap-6">
        {filtered.map((s) => (
          <div
            key={s._id}
            className="bg-white border rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition"
          >
            <div>
              {/* DELIVERY BADGE */}
              <span className="inline-block text-xs mb-2 px-2 py-1 rounded border">
                {s.deliveryType === "instant" && "⚡ Instant"}
                {s.deliveryType === "manual" && "🕒 Manual Review"}
                {s.deliveryType === "assisted" && "🤝 Assisted"}
              </span>

              <h3 className="font-semibold text-lg text-[#0F172A]">
                {s.title}
              </h3>

              <p className="text-sm text-[#64748B] mt-2 line-clamp-3">
                {s.description}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Starting at</p>
                <p className="text-xl font-bold">${s.price}</p>
              </div>

              <button
                onClick={() => buyService(s._id)}
                className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
              >
                Buy Service
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EMPTY */}
      {!loading && filtered.length === 0 && (
        <p className="text-slate-500 mt-10">
          No services available in this category.
        </p>
      )}

      {/* TRUST */}
      <div className="mt-16 border-t pt-6 text-sm text-slate-500 max-w-3xl">
        ⚠️ UREMO is an independent service provider. We are not affiliated with
        any platform. All services are handled manually and approval depends on
        platform rules and user history.
      </div>
    </div>
  );
}
