"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  deliveryType?: string;
  images?: string[];
}

export default function BuyService() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const loadServices = async () => {
    try {
      const data = await apiRequest("/api/services", "GET");
      setServices(data);
    } catch (err: any) {
      alert(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "all",
    ...Array.from(new Set(services.map((s: any) => s.category))),
  ];

  const filteredServices =
    selectedCategory === "all"
      ? services
      : services.filter((s: any) => s.category === selectedCategory);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Buy a Service</h1>
        <p className="text-[#9CA3AF]">
          All services are manually verified and delivered by UREMO.
        </p>
      </div>

      {/* Services */}
      {loading && <p>Loading services...</p>}

      {!loading && services.length === 0 && (
        <Card>
          <p className="text-sm text-[#9CA3AF]">
            No services available at the moment.
          </p>
        </Card>
      )}

      {/* Category Filter */}
      {!loading && services.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded border transition ${
                selectedCategory === cat
                  ? "bg-[#3B82F6] text-white border-[#3B82F6]"
                  : "bg-transparent border-[#1F2937] text-[#E5E7EB] hover:border-[#3B82F6]"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((s: Service) => (
          <div
            key={s._id}
            className="border border-[#1F2937] rounded-lg overflow-hidden bg-[#020617]"
          >
            {/* Image */}
            <div className="h-40 bg-black">
              <img
                src={s.images?.[0] || "/placeholder.png"}
                alt={s.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
              <div>
                <p className="text-xs text-[#9CA3AF] uppercase">{s.category}</p>
                <h3 className="font-semibold text-lg">{s.title}</h3>
              </div>

              <p className="text-sm text-[#9CA3AF]">{s.description}</p>

              <div className="flex justify-between items-center pt-2">
                <div className="space-y-1">
                  <span className="font-bold text-[#22C55E] block">
                    ${s.price}
                  </span>
                  <p className="text-xs text-[#6B7280]">{s.deliveryType}</p>
                </div>

                <button
                  onClick={() => buyService(s._id)}
                  className="px-3 py-1 bg-[#3B82F6] rounded text-sm hover:bg-blue-500"
                >
                  Buy
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Block */}
      <Card>
        <p className="text-sm text-[#9CA3AF]">
          ⚠️ Payments are not automated. After placing an order, you will
          complete payment manually and upload proof for human verification.
        </p>
      </Card>
    </div>
  );
}
